import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, MessageSquare, CheckSquare, Settings, RefreshCw, Loader2, 
  TrendingUp, AlertCircle, LogOut, Mail, Lock, UserPlus, LogIn, Brain, Cpu, 
  Database, BarChart3, PieChart, Users, Clock, ArrowDownRight, ArrowUpRight, Bell,
  Bug, Plus, Trash2, Wallet, Sparkles, CreditCard, Calendar, CheckCircle2, XCircle
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
const DAILY_ROUTINE = []; 

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
  { day: 30, name: 'Intuit QuickBooks', amount: 28.68 },
  { day: 'Fri', name: 'Honeycomb (VA)', amount: 35.00 }
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

const StatCard = ({ label, value, subtext, icon: Icon, color }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      <h3 className={`text-2xl font-bold text-slate-800`}>{value}</h3>
      {subtext && <p className={`text-xs mt-1 font-medium ${color}`}>{subtext}</p>}
    </div>
    {Icon && <div className={`p-2 rounded-lg bg-${color.split('-')[1]}-50 text-${color.split('-')[1]}-500`}><Icon className="w-5 h-5" /></div>}
  </div>
);

const SourceRow = ({ source, data }) => {
  const retColor = data.retentionRate >= 90 ? 'text-green-600' : data.retentionRate >= 75 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-slate-800 text-sm">{source}</h4>
        <div className="flex flex-col items-end">
             <span className={`text-sm font-bold ${retColor}`}>{data.retentionRate}% Ret.</span>
             <span className="text-[10px] text-slate-400">{data.avgLifetime}mo avg life</span>
        </div>
      </div>
      <div className="flex gap-2">
         <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-blue-500 font-bold uppercase">Active</p>
            <p className="text-lg font-bold text-blue-700">{data.active}</p>
         </div>
         <div className="flex-1 bg-red-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-red-500 font-bold uppercase">Churn</p>
            <p className="text-lg font-bold text-red-700">{data.churn}</p>
         </div>
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
  const handleSubmit = async (e) => { e.preventDefault(); setError(''); setLoading(true); if (!auth) { setError("App not configured"); return; } try { isSignUp ? await createUserWithEmailAndPassword(auth, email, password) : await signInWithEmailAndPassword(auth, email, password); } catch (err) { setError(err.message.replace('Firebase:', '').trim()); } finally { setLoading(false); } };
  return (<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4"><div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm border border-slate-100"><div className="text-center mb-8"><h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">versaBOT</h1><p className="text-slate-400 text-sm">Business Manager</p></div>{error && <div className="mb-4 p-3 bg-red-50 text-red-500 text-xs rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}<form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">Email</label><div className="relative"><Mail className="w-5 h-5 absolute left-3 top-3 text-slate-400" /><input type="email" required className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}/></div></div><div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">Password</label><div className="relative"><Lock className="w-5 h-5 absolute left-3 top-3 text-slate-400" /><input type="password" required className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/></div></div><button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />)} {isSignUp ? 'Create Account' : 'Sign In'}</button></form><button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-4 text-xs text-slate-500 hover:text-blue-600">{isSignUp ? "Already have an account? Sign In" : "Need an account? Create one"}</button></div></div>);
};

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [liveData, setLiveData] = useState(null); 
  const [analytics, setAnalytics] = useState(null);
  const [growthData, setGrowthData] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null); 
  
  // Finance State
  const [bankIncome, setBankIncome] = useState(0);
  const [financeReport, setFinanceReport] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [firestoreData, setFirestoreData] = useState({
    gasUrl: '',
    targets: { monthly: 20000, weekly: 5000 },
    ccBalance: 500,
    cashflowPrompt: '',
    aiModel: 'gemini-2.0-flash-exp'
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
        setFirestoreData(prev => ({ ...prev, ...data, aiModel: data.aiModel || 'gemini-2.0-flash-exp' })); 
      } else {
        setDoc(docRef, { gasUrl: '', targets: { monthly: 20000, weekly: 5000 }, ccBalance: 500, cashflowPrompt: '', aiModel: 'gemini-2.0-flash-exp' });
        setFirestoreData({ gasUrl: '', targets: { monthly: 20000, weekly: 5000 }, ccBalance: 500, cashflowPrompt: '', aiModel: 'gemini-2.0-flash-exp' });
      }
    });
    return () => unsubscribeSnapshot();
  }, [user]);

  // --- UTILS ---
  const parseSheetDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('-')) { const parts = dateStr.split('-'); if (parts.length === 3) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])); }
    if (dateStr.includes('/')) { const parts = dateStr.split('/'); if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])); }
    const d = new Date(dateStr); return isNaN(d.getTime()) ? null : d;
  };

  // --- ANALYTICS ---
  const processMarketingData = (rawData) => {
    if (!rawData || rawData.length < 2) return null;
    const headers = rawData[0].map(h => h.toString().toLowerCase().trim());
    const idx = {
        source: headers.indexOf('source'), created: headers.indexOf('created'),
        lastDone: headers.indexOf('last done'), state: headers.indexOf('state'),
        jobState: headers.findIndex(h => h.includes('job') && h.includes('state')), 
        service: headers.indexOf('services'), freq: headers.indexOf('frequency')
    };

    if (idx.source === -1 || idx.state === -1) { setAnalyticsError(`Missing Columns`); return null; }

    const sources = {};
    const validSources = ['LSA', 'Facebook Ads', 'Website', 'Leaflet', 'Canvassed', 'Social Media', 'Google'];
    validSources.forEach(s => sources[s] = { active: 0, churn: 0, lifespans: [] });
    sources['Other'] = { active: 0, churn: 0, lifespans: [] };
    
    let totalActiveCount = 0; 
    const TRACK_START_DATE = new Date(2026, 0, 12);

    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        const createdDate = parseSheetDate(row[idx.created]);
        if (!createdDate || createdDate < TRACK_START_DATE) continue; 

        const rawSource = row[idx.source]?.toString().trim() || 'Other';
        const sourceKey = validSources.find(s => s.toLowerCase() === rawSource.toLowerCase()) || 'Other';
        const state = row[idx.state]?.toString().trim().toLowerCase() || '';
        const jobState = row[idx.jobState]?.toString().trim().toLowerCase() || '';
        const service = row[idx.service]?.toString().toLowerCase() || '';
        const freq = row[idx.freq]?.toString().toLowerCase() || '';
        const isWindowCleaning = service.includes('window cleaning'); 
        const isValidFreq = freq.includes('4') || freq.includes('8');

        if (isWindowCleaning && isValidFreq) {
            if (state === 'active' && jobState === '') {
                sources[sourceKey].active++;
                totalActiveCount++;
            } 
            else if (state === 'inactive') {
                sources[sourceKey].churn++;
                const last = parseSheetDate(row[idx.lastDone]);
                if (last) {
                    const months = (last.getFullYear() - createdDate.getFullYear()) * 12 + (last.getMonth() - createdDate.getMonth());
                    if (months > 0) sources[sourceKey].lifespans.push(months);
                }
            }
        }
    }

    const START_COUNT = 814;
    const END_COUNT = 1600;
    const TRACK_END_DATE = new Date(2026, 11, 31);
    const today = new Date();
    const daysPassed = Math.ceil((today - TRACK_START_DATE) / (1000 * 60 * 60 * 24)); 
    const dailyGrowthNeeded = (END_COUNT - START_COUNT) / 353; // Approx days
    const targetToday = Math.floor(START_COUNT + (daysPassed * dailyGrowthNeeded));
    const actualToday = START_COUNT + totalActiveCount;
    
    setGrowthData({ actual: actualToday, target: targetToday, diff: actualToday - targetToday, status: (actualToday - targetToday) >= 0 ? 'Ahead' : 'Behind' });

    return Object.entries(sources).map(([name, data]) => ({
        name, active: data.active, churn: data.churn,
        retentionRate: data.active + data.churn > 0 ? Math.round((data.active / (data.active + data.churn)) * 100) : 0,
        avgLifetime: data.lifespans.length > 0 ? Math.round(data.lifespans.reduce((a,b) => a+b, 0) / data.lifespans.length) : 0
    })).sort((a,b) => b.active - a.active); 
  };

  const processBankData = (bankRows) => {
    if(!bankRows || bankRows.length < 2) return 0;
    let mtdIncome = 0;
    for(let i=1; i<bankRows.length; i++) {
        const amount = parseFloat(bankRows[i][1]);
        if(!isNaN(amount) && amount > 0) mtdIncome += amount;
    }
    setBankIncome(mtdIncome);
  };

  const fetchLiveData = async () => {
    if (!firestoreData.gasUrl) return null;
    try {
      const secureUrl = `${firestoreData.gasUrl}?token=${GAS_TOKEN}`;
      const res = await fetch(secureUrl);
      const data = await res.json();
      setDebugInfo(data);
      if (data.error) { setAnalyticsError(data.error); } 
      else {
        setLiveData(data);
        if (data.marketing_raw) setAnalytics(processMarketingData(data.marketing_raw));
        if (data.bank_raw) processBankData(data.bank_raw);
      }
    } catch (error) { setAnalyticsError(error.message); }
  };

  useEffect(() => { if (firestoreData.gasUrl) fetchLiveData(); }, [firestoreData.gasUrl]);

  // --- CASHFLOW ENGINE (THE BRAIN) ---
  const runCashflowAnalysis = async () => {
    if (!liveData?.bank_raw || !liveData?.marketing_raw || !liveData?.jobs_raw) { alert("Data Loading..."); return; }
    
    setIsAnalyzing(true);
    
    // 1. CALCULATE PROJECTED REVENUE
    // We need to cross reference Sheet3 (Payment Methods) with Sheet2 (Dates)
    // Sheet 3 Headers: Check for 'GoCardless' (Col 7) and 'Stripe' (Col 8) - Fuzzy logic used
    const jobRows = liveData.jobs_raw;
    const historyRows = liveData.marketing_raw;

    // Create Map: Customer Name -> Payment Method
    const paymentMap = {};
    if (jobRows.length > 1) {
        // Assume Col 3 = Name. Check headers for GC/Stripe
        const jHeaders = jobRows[0].map(h => h.toLowerCase());
        const nameIdx = 3; 
        const gcIdx = jHeaders.findIndex(h => h.includes('gocardless'));
        const stripeIdx = jHeaders.findIndex(h => h.includes('stripe'));
        
        for (let i=1; i<jobRows.length; i++) {
            const row = jobRows[i];
            const name = row[nameIdx]?.trim();
            if (name) {
                const isAutoPay = (gcIdx > -1 && row[gcIdx]?.toLowerCase().includes('active')) || 
                                  (stripeIdx > -1 && row[stripeIdx]?.toLowerCase().includes('active'));
                if (isAutoPay) paymentMap[name] = true;
            }
        }
    }

    // Scan Schedule for Revenue
    const today = new Date();
    let projectedRevenue = 0;
    const upcomingJobs = [];

    if (historyRows.length > 1) {
        const hHeaders = historyRows[0].map(h => h.toLowerCase());
        const nameIdx = 3; 
        const lastDoneIdx = hHeaders.indexOf('last done');
        const nextDueIdx = hHeaders.indexOf('next due');
        const priceIdx = hHeaders.indexOf('price');

        for (let i=1; i<historyRows.length; i++) {
            const row = historyRows[i];
            const name = row[nameIdx]?.trim();
            const price = parseFloat(row[priceIdx]) || 0;
            
            if (paymentMap[name]) { // Only calculate if AutoPay
                // Rule 1: Cleaned Last Week (Last Done + 7 Days > Today)
                const lastDone = parseSheetDate(row[lastDoneIdx]);
                if (lastDone) {
                    const paymentDate = new Date(lastDone);
                    paymentDate.setDate(paymentDate.getDate() + 7);
                    if (paymentDate >= today && paymentDate <= new Date(today.getTime() + 21*24*60*60*1000)) {
                        projectedRevenue += price;
                        upcomingJobs.push(`${name} (£${price}) - Due: ${paymentDate.toLocaleDateString()}`);
                        continue; // Don't double count
                    }
                }

                // Rule 2: Due Next 2 Weeks (Next Due + 7 Days)
                const nextDue = parseSheetDate(row[nextDueIdx]);
                if (nextDue) {
                    const paymentDate = new Date(nextDue);
                    paymentDate.setDate(paymentDate.getDate() + 7);
                    // Check if payment falls in our 21 day window
                    if (paymentDate >= today && paymentDate <= new Date(today.getTime() + 21*24*60*60*1000)) {
                         projectedRevenue += price;
                         upcomingJobs.push(`${name} (£${price}) - Forecast: ${paymentDate.toLocaleDateString()}`);
                    }
                }
            }
        }
    }

    // Apply VAT Rule
    const netProjected = projectedRevenue * 0.82; // Remove 18%

    // 2. CHECK PAID BILLS
    const bankCSV = liveData.bank_raw.slice(1).map(r => r.join(" ")).join("\n").toLowerCase();
    const pendingBills = [];
    let committedSpend = 0;

    RECURRING_BILLS_TEMPLATE.forEach(bill => {
        const billDay = typeof bill.day === 'number' ? bill.day : 99; // 99 for weekly items logic needed later
        // Simple check: Has this bill name appeared in bank CSV this month?
        // Note: Ideally check date, but name match is a good proxy for "Paid this month"
        if (!bankCSV.includes(bill.name.toLowerCase().split(' ')[0])) { 
             // Determine if it falls in the 21 day window
             const currentDay = today.getDate();
             let isDue = false;
             // Logic: If bill day is upcoming in current month OR early next month
             if (billDay > currentDay || billDay < 10) isDue = true; 
             
             if (isDue) {
                pendingBills.push(`${bill.name} (£${bill.amount})`);
                committedSpend += bill.amount;
             }
        }
    });

    // Add Credit Card if not paid
    if (!bankCSV.includes('credit card') && firestoreData.ccBalance > 0) {
        pendingBills.push(`Credit Card (£${firestoreData.ccBalance})`);
        committedSpend += Number(firestoreData.ccBalance);
    }

    const systemPrompt = `
      ROLE: Aggressive Financial Controller.
      
      TASK: 
      ${firestoreData.cashflowPrompt}

      --- PRE-CALCULATED DATA (By App Engine) ---
      1. REAL-TIME MTD INCOME: £${bankIncome.toFixed(2)}
      2. PROJECTED REVENUE (Next 21 Days): £${netProjected.toFixed(2)}
         (Calculated using 7-Day Lag Rule on AutoPay customers & 18% VAT Removed)
      3. COMMITTED SPEND (Remaining): £${committedSpend.toFixed(2)}
      
      --- LISTS ---
      PENDING BILLS: 
      ${pendingBills.join(', ')}

      FORECASTED JOB PAYMENTS (Sample):
      ${upcomingJobs.slice(0, 10).join(', ')}...

      OUTPUT:
      - Start with verdict: 🟢 SAFE or 🔴 DANGER.
      - Net Cash Position (Income - Spend).
      - Specific warnings about bills vs revenue timing.
      - Currency: GBP (£).
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${firestoreData.aiModel || 'gemini-2.0-flash-exp'}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        }
      );
      const data = await response.json();
      setFinanceReport(data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis Failed.");
    } catch (e) {
        setFinanceReport("Connection Error: " + e.message);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    const updates = {
        gasUrl: firestoreData.gasUrl,
        'targets.monthly': Number(firestoreData.targets.monthly),
        'targets.weekly': Number(firestoreData.targets.weekly),
        ccBalance: Number(firestoreData.ccBalance),
        cashflowPrompt: firestoreData.cashflowPrompt || '',
        aiModel: firestoreData.aiModel || 'gemini-2.0-flash-exp'
    };
    try { await updateDoc(docRef, updates); alert('Settings Saved'); fetchLiveData(); } 
    catch(err) { await setDoc(docRef, updates, { merge: true }); alert('Settings Saved'); fetchLiveData(); }
  };

  const handleSignOut = () => auth && signOut(auth).catch(e => console.error(e));
  const fmt = (num) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(num || 0);

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
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {!firestoreData.gasUrl && <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 items-start"><AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" /><div><h3 className="font-semibold text-yellow-800 text-sm">Setup Required</h3><p className="text-xs text-yellow-700 mt-1">Configure Data Source in settings.</p></div></div>}
            <div><h2 className="text-lg font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Performance</h2><ProgressBar label="Monthly Turnover" current={liveData?.financials?.turnover_mtd || 0} target={firestoreData.targets.monthly} /><ProgressBar label="Weekly Turnover" current={liveData?.financials?.turnover_wtd || 0} target={firestoreData.targets.weekly} /></div>
            <div className="grid grid-cols-2 gap-3"><KPICard title="Turnover MTD" value={fmt(liveData?.financials?.turnover_mtd)} /><KPICard title="Debtors Total" value={fmt(liveData?.financials?.debtors_total)} alert={(liveData?.financials?.debtors_total || 0) > 5000} /><KPICard title="New Cust Value" value={fmt(liveData?.customers?.new_value_4w)} subtext="This Month" /><KPICard title="Churn" value={liveData?.customers?.churn_count || 0} alert={(liveData?.customers?.churn_count || 0) > 0} subtext="Clients Lost" /></div>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-6">
             <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg"><h2 className="font-bold text-lg mb-1 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" /> Marketing Analytics</h2><p className="text-xs opacity-70">2026 Onwards. Active = Empty Job State.</p></div>
             {analyticsError ? <div className="bg-red-50 p-4 rounded-xl text-red-600 text-sm"><p className="font-bold flex items-center gap-2"><Bug className="w-4 h-4"/> Data Error</p><p className="mt-1">{analyticsError}</p></div> : !analytics ? <div className="text-center py-10 text-slate-400 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-2" /><p className="text-xs">Processing data...</p></div> : (
                <>
                  {growthData && <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Growth Track (Goal: 1600)</p><h3 className="text-2xl font-bold text-slate-800">{growthData.actual} <span className="text-xs text-slate-400 font-normal">/ {growthData.target} target</span></h3></div><div className={`text-right px-3 py-2 rounded-lg ${growthData.diff >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}><p className="text-sm font-bold flex items-center gap-1">{growthData.diff >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}{growthData.diff > 0 ? '+' : ''}{growthData.diff}</p><p className="text-[10px] font-bold uppercase opacity-80">{growthData.status}</p></div></div>}
                  <div className="grid grid-cols-2 gap-3"><StatCard label="Total 2026 Adds" value={analytics.reduce((a,b) => a + b.active, 0)} icon={Users} color="text-blue-600" /><StatCard label="Avg Retention" value={`${Math.round(analytics.reduce((a,b) => a + b.retentionRate, 0) / analytics.length)}%`} icon={PieChart} color="text-green-600" /></div>
                  <div><h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2"><Database className="w-4 h-4 text-blue-600" /> Source Breakdown</h3><div className="space-y-3">{analytics.map((source) => <SourceRow key={source.name} source={source.name} data={source} />)}</div></div>
                </>
             )}
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-start mb-4"><div><h2 className="font-bold text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-green-400" /> Live Position</h2><p className="text-xs text-slate-400">Month to Date (Starling)</p></div></div>
                <div className="flex items-end justify-between"><div><p className="text-3xl font-bold text-white">{fmt(bankIncome)}</p><p className="text-xs text-slate-400 mt-1">Incoming</p></div><div className="text-right"></div></div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" /> AI Forecast</h3><button onClick={runCashflowAnalysis} disabled={isAnalyzing} className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2">{isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}{isAnalyzing ? "Analyzing..." : "Run Forecast"}</button></div>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 min-h-[150px] whitespace-pre-wrap leading-relaxed border border-slate-100">{financeReport || "Tap 'Run Forecast' to analyze pending jobs, VAT rules, and recurring bills..."}</div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Configuration</h2>
            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Google Apps Script URL</label><input value={firestoreData.gasUrl} onChange={(e) => setFirestoreData({...firestoreData, gasUrl: e.target.value})} placeholder="https://script.google.com/..." className="w-full p-3 rounded-lg border border-slate-200 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Monthly Target (£)</label><input type="number" value={firestoreData.targets.monthly} onChange={(e) => setFirestoreData({...firestoreData, targets: {...firestoreData.targets, monthly: e.target.value}})} className="w-full p-3 rounded-lg border border-slate-200 text-sm" /></div><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Weekly Target (£)</label><input type="number" value={firestoreData.targets.weekly} onChange={(e) => setFirestoreData({...firestoreData, targets: {...firestoreData.targets, weekly: e.target.value}})} className="w-full p-3 rounded-lg border border-slate-200 text-sm" /></div></div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Credit Card (Due 6th)</label><div className="flex items-center gap-2"><span className="text-slate-400">£</span><input type="number" value={firestoreData.ccBalance} onChange={(e) => setFirestoreData({...firestoreData, ccBalance: e.target.value})} className="w-full p-2 rounded border border-slate-200 text-sm" /></div></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Cpu className="w-4 h-4" /> AI Model ID</label><input value={firestoreData.aiModel} onChange={(e) => setFirestoreData({...firestoreData, aiModel: e.target.value})} placeholder="gemini-2.0-flash-exp" className="w-full p-3 rounded-lg border border-slate-200 text-sm" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Wallet className="w-4 h-4" /> Cashflow Logic / Prompt</label><textarea value={firestoreData.cashflowPrompt} onChange={(e) => setFirestoreData({...firestoreData, cashflowPrompt: e.target.value})} placeholder="Paste your instructions for the Financial Controller AI here..." className="w-full p-3 rounded-lg border border-slate-200 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
              <div className="bg-slate-100 p-4 rounded-lg overflow-hidden"><label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2"><Bug className="w-4 h-4" /> Connection Debug</label><p className="text-[10px] text-slate-500 font-mono break-all">{debugInfo?.error ? `Script Error: ${debugInfo.error}` : debugInfo?.marketing_raw ? `Connected. Columns: ${JSON.stringify(debugInfo.marketing_raw[0])}` : "No Data. Check URL."}</p></div>
              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors">Save Settings</button>
            </form>
          </div>
        )}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe flex justify-between items-center z-20">
        {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Home' }, { id: 'marketing', icon: BarChart3, label: 'Analytics' }, { id: 'finance', icon: Wallet, label: 'Cashflow' }, { id: 'settings', icon: Settings, label: 'Settings' }].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'} relative`}><item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} /><span className="text-[10px] font-medium">{item.label}</span></button>
        ))}
      </nav>
    </div>
  );
}

export default App;
