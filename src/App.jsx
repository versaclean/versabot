import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Settings, RefreshCw, Loader2, TrendingUp, AlertCircle, 
  LogOut, Mail, Lock, UserPlus, LogIn, Bug, BarChart3, Users, Bell, 
  Wallet, Sparkles, CreditCard, Calendar
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut 
} from 'firebase/auth';
import { 
  getFirestore, doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const GAS_TOKEN = import.meta.env.VITE_GAS_TOKEN;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const APP_ID = 'versabot-pwa-v1';

let app, auth, db;
let isConfigured = false;

if (firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isConfigured = true;
  } catch (e) {
    console.error("Firebase Init Error", e);
  }
}

// --- CONSTANTS ---
const RECURRING_BILLS_TEMPLATE = [
  { day: 2, name: 'DVLA Tax', amount: 90.54 },
  { day: 6, name: 'Admiral Insurance', amount: 364.47 },
  { day: 6, name: 'Vodafone', amount: 66.63 },
  { day: 9, name: 'O2', amount: 33.70 },
  { day: 12, name: 'Airlandline', amount: 11.99 },
  { day: 13, name: 'Cyril Chadwick (Water)', amount: 140.00 },
  { day: 15, name: 'Virpa (VA)', amount: 300.00 },
  { day: 17, name: 'United Trust Bank', amount: 403.27 },
  { day: 18, name: 'Premium Credit', amount: 128.38 },
  { day: 28, name: 'Staff Wages', amount: 6050.00 },
  { day: 29, name: 'LDF Finance', amount: 238.71 },
  { day: 30, name: 'Intuit QuickBooks', amount: 28.68 }
];

// --- COMPONENTS ---
const KPICard = ({ title, value, subtext, alert }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col">
    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
    <h3 className={`text-2xl font-bold ${alert ? 'text-red-500' : 'text-slate-800'}`}>{value}</h3>
    {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
  </div>
);

const ProgressBar = ({ current, target, label }) => {
  const percentage = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
      <div className="flex justify-between items-end mb-2">
        <div className="flex justify-between w-full">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <span className="text-xs text-slate-500">
            {percentage.toFixed(1)}% of {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(target)}
            </span>
        </div>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

const LoginScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (!auth) { setError("App not configured"); return; }
    try { isSignUp ? await createUserWithEmailAndPassword(auth, email, password) : await signInWithEmailAndPassword(auth, email, password); } 
    catch (err) { setError(err.message.replace('Firebase:', '').trim()); } 
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm border border-slate-100">
        <div className="text-center mb-8"><h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">versaBOT</h1><p className="text-slate-400 text-sm">Business Manager</p></div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-500 text-xs rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">Email</label><div className="relative"><Mail className="w-5 h-5 absolute left-3 top-3 text-slate-400" /><input type="email" required className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}/></div></div>
          <div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">Password</label><div className="relative"><Lock className="w-5 h-5 absolute left-3 top-3 text-slate-400" /><input type="password" required className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/></div></div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />)} {isSignUp ? 'Create Account' : 'Sign In'}</button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-4 text-xs text-slate-500 hover:text-blue-600">{isSignUp ? "Already have an account? Sign In" : "Need an account? Create one"}</button>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [liveData, setLiveData] = useState(null); 
  const [financeReport, setFinanceReport] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [firestoreData, setFirestoreData] = useState({
    gasUrl: '',
    targets: { monthly: 20000, weekly: 5000 },
    ccBalance: 500, // Default Credit Card Balance
    aiModel: 'gemini-1.5-flash',
    cashflowPrompt: ''
  });

  useEffect(() => {
    if (!isConfigured || !auth) { setAuthLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setAuthLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data.gasUrl) data.gasUrl = '';
        setFirestoreData(prev => ({ ...prev, ...data })); 
      } else {
        setDoc(docRef, { gasUrl: '', targets: { monthly: 20000, weekly: 5000 }, ccBalance: 500, aiModel: 'gemini-1.5-flash', cashflowPrompt: '' });
        setFirestoreData({ gasUrl: '', targets: { monthly: 20000, weekly: 5000 }, ccBalance: 500, aiModel: 'gemini-1.5-flash', cashflowPrompt: '' });
      }
    });
    return () => unsubscribeSnapshot();
  }, [user]);

  const fetchLiveData = async () => {
    if (!firestoreData.gasUrl) return null;
    try {
      const secureUrl = `${firestoreData.gasUrl}?token=${GAS_TOKEN}`;
      const res = await fetch(secureUrl);
      const data = await res.json();
      if (!data.error) setLiveData(data);
      return data;
    } catch (error) { return null; }
  };

  useEffect(() => { if (firestoreData.gasUrl) fetchLiveData(); }, [firestoreData.gasUrl]);

  const handleSignOut = () => auth && signOut(auth).catch(e => console.error(e));

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    const updates = {
        gasUrl: firestoreData.gasUrl,
        'targets.monthly': Number(firestoreData.targets.monthly),
        'targets.weekly': Number(firestoreData.targets.weekly),
        ccBalance: Number(firestoreData.ccBalance),
        aiModel: firestoreData.aiModel || 'gemini-1.5-flash',
        cashflowPrompt: firestoreData.cashflowPrompt || ''
    };
    try { await updateDoc(docRef, updates); alert('Settings Saved'); fetchLiveData(); } 
    catch(err) { await setDoc(docRef, updates, { merge: true }); alert('Settings Saved'); fetchLiveData(); }
  };

  const fmt = (num) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(num || 0);

  // --- CASHFLOW ENGINE ---
  const calculateCashflow = () => {
    if (!liveData) return { mtdIncome: 0, pendingExpenses: 0 };
    
    // 1. MTD Bank Income
    let mtdIncome = 0;
    if (liveData.bank_raw) {
        liveData.bank_raw.slice(1).forEach(row => {
            const amt = parseFloat(row[1]);
            if (!isNaN(amt) && amt > 0) mtdIncome += amt;
        });
    }

    // 2. Pending Expenses (Burn Rate)
    const today = new Date().getDate();
    let pendingExpenses = 0;
    const bills = [...RECURRING_BILLS_TEMPLATE, { day: 6, name: 'Credit Card', amount: firestoreData.ccBalance }];
    
    bills.forEach(bill => {
        if (bill.day > today) pendingExpenses += bill.amount;
    });

    return { mtdIncome, pendingExpenses };
  };

  const cashflowStats = useMemo(calculateCashflow, [liveData, firestoreData.ccBalance]);

  const runCashflowAnalysis = async () => {
    if (!liveData?.bank_raw || !liveData?.marketing_raw || !liveData?.jobs_raw) { alert("Data Loading..."); return; }
    if (!firestoreData.cashflowPrompt) { alert("Please set a Prompt in Settings first."); return; }
    
    setIsAnalyzing(true);
    
    const bankCSV = liveData.bank_raw.slice(0, 300).map(row => row.join(",")).join("\n");
    const jobsCSV = liveData.jobs_raw.slice(0, 300).map(row => row.join(",")).join("\n");
    const historyCSV = liveData.marketing_raw.slice(0, 300).map(row => row.join(",")).join("\n");

    const systemPrompt = `
      ROLE: Expert Financial Controller for a Window Cleaning Business.
      
      TASK: 
      ${firestoreData.cashflowPrompt}

      DATA SOURCES:
      1. RECURRING BILLS (Remaining this month):
         ${JSON.stringify(RECURRING_BILLS_TEMPLATE)}
         (Plus Credit Card Bill of £${firestoreData.ccBalance} due on the 6th).
      
      2. REVENUE RULES:
         - Cross-reference 'jobs_raw' (Active Jobs) with 'history_raw' (Last Clean Date).
         - If Job has GoCardless/Stripe 'Active', forecast cash inflow 7 DAYS after 'Last Done'.
         - DEDUCT 18% VAT from all forecasted inflows.
         - Do NOT forecast Cash/Bank Transfer jobs (only count if already in bank_raw).

      3. RAW DATA:
         - BANK_RAW (MTD Actuals): \n${bankCSV}
         - JOBS_RAW (Payment Methods): \n${jobsCSV}
         - HISTORY_RAW (Dates): \n${historyCSV}

      OUTPUT:
      - "Projected Month-End Cash" (Bank Balance + Forecasted Revenue - Pending Bills).
      - "Status": On Track / Behind Target (£${firestoreData.targets.monthly}).
      - List any upcoming large bills.
      - 1 Actionable tip.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${firestoreData.aiModel || 'gemini-1.5-flash'}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        }
      );
      const data = await response.json();
      setFinanceReport(data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated.");
    } catch (e) {
        setFinanceReport("Error: " + e.message);
    } finally {
        setIsAnalyzing(false);
    }
  };

  if (!isConfigured) return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h1 className="text-xl font-bold">Setup Required</h1><p>Missing Env Vars</p></div>;
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans text-slate-900">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">versaBOT</h1>
        <div className="flex gap-2">
            {activeTab === 'dashboard' && <button onClick={fetchLiveData} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><RefreshCw className="w-4 h-4 text-slate-600" /></button>}
            <button onClick={handleSignOut} className="p-2 bg-slate-100 rounded-full hover:bg-red-50 text-slate-600 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>

      <main className="p-4 max-w-2xl mx-auto">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {!firestoreData.gasUrl && <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 items-start"><AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" /><div><h3 className="font-semibold text-yellow-800 text-sm">Setup Required</h3><p className="text-xs text-yellow-700 mt-1">Configure Data Source in settings.</p></div></div>}
            <div><h2 className="text-lg font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Performance</h2><ProgressBar label="Monthly Turnover" current={liveData?.financials?.turnover_mtd || 0} target={firestoreData.targets.monthly} /><ProgressBar label="Weekly Turnover" current={liveData?.financials?.turnover_wtd || 0} target={firestoreData.targets.weekly} /></div>
            <div className="grid grid-cols-2 gap-3"><KPICard title="Turnover MTD" value={fmt(liveData?.financials?.turnover_mtd)} /><KPICard title="Debtors Total" value={fmt(liveData?.financials?.debtors_total)} alert={(liveData?.financials?.debtors_total || 0) > 5000} /><KPICard title="New Cust Value" value={fmt(liveData?.customers?.new_value_4w)} subtext="This Month" /><KPICard title="Churn" value={liveData?.customers?.churn_count || 0} alert={(liveData?.customers?.churn_count || 0) > 0} subtext="Clients Lost" /></div>
          </div>
        )}

        {/* CASHFLOW TAB */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="font-bold text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-green-400" /> Live Position</h2>
                        <p className="text-xs text-slate-400">Month to Date (Starling)</p>
                    </div>
                </div>
                <div className="flex items-end justify-between">
                   <div>
                       <p className="text-3xl font-bold text-white">{fmt(cashflowStats.mtdIncome)}</p>
                       <p className="text-xs text-slate-400 mt-1">Incoming</p>
                   </div>
                   <div className="text-right">
                       <p className="text-xl font-bold text-red-400">-{fmt(cashflowStats.pendingExpenses)}</p>
                       <p className="text-xs text-slate-400 mt-1">Est. Bills Remaining</p>
                   </div>
                </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" /> AI Forecast</h3>
                   <button 
                      onClick={runCashflowAnalysis} 
                      disabled={isAnalyzing}
                      className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
                   >
                      {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      {isAnalyzing ? "Analyzing..." : "Run Forecast"}
                   </button>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 min-h-[150px] whitespace-pre-wrap leading-relaxed border border-slate-100">
                    {financeReport || "Tap 'Run Forecast' to analyze pending jobs, VAT rules, and recurring bills..."}
                </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
               <p className="font-bold mb-1">ℹ️ Forecast Rules:</p>
               <ul className="list-disc ml-4 space-y-1">
                   <li>Pending GoCardless/Stripe jobs included (7-day lag applied).</li>
                   <li>18% VAT deducted from forecasts.</li>
                   <li>Cash/Transfer jobs excluded until paid.</li>
               </ul>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Configuration</h2>
            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Google Apps Script URL</label><input value={firestoreData.gasUrl} onChange={(e) => setFirestoreData({...firestoreData, gasUrl: e.target.value})} placeholder="https://script.google.com/..." className="w-full p-3 rounded-lg border border-slate-200 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Monthly Target (£)</label><input type="number" value={firestoreData.targets.monthly} onChange={(e) => setFirestoreData({...firestoreData, targets: {...firestoreData.targets, monthly: e.target.value}})} className="w-full p-3 rounded-lg border border-slate-200 text-sm" /></div><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Weekly Target (£)</label><input type="number" value={firestoreData.targets.weekly} onChange={(e) => setFirestoreData({...firestoreData, targets: {...firestoreData.targets, weekly: e.target.value}})} className="w-full p-3 rounded-lg border border-slate-200 text-sm" /></div></div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                 <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Credit Card (Due 6th)</label>
                 <div className="flex items-center gap-2">
                    <span className="text-slate-400">£</span>
                    <input 
                      type="number" 
                      value={firestoreData.ccBalance} 
                      onChange={(e) => setFirestoreData({...firestoreData, ccBalance: e.target.value})}
                      className="w-full p-2 rounded border border-slate-200 text-sm"
                    />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-2">Update this monthly for accurate forecasting.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Cpu className="w-4 h-4" /> AI Model ID</label>
                <input value={firestoreData.aiModel} onChange={(e) => setFirestoreData({...firestoreData, aiModel: e.target.value})} placeholder="gemini-1.5-flash" className="w-full p-3 rounded-lg border border-slate-200 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Wallet className="w-4 h-4" /> Cashflow Logic / Prompt</label>
                <textarea 
                  value={firestoreData.cashflowPrompt} 
                  onChange={(e) => setFirestoreData({...firestoreData, cashflowPrompt: e.target.value})}
                  placeholder="Paste your instructions for the Financial Controller AI here..."
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors">Save Settings</button>
            </form>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe flex justify-between items-center z-20">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
          { id: 'finance', icon: Wallet, label: 'Cashflow' }, 
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'} relative`}>
            <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
