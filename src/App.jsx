import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, MessageSquare, CheckSquare, Settings, RefreshCw, Loader2, 
  TrendingUp, AlertCircle, LogOut, Mail, Lock, UserPlus, LogIn, Brain, Cpu, 
  Database, BarChart3, PieChart, Users, Clock, ArrowDownRight, ArrowUpRight, Bell
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
const DAILY_ROUTINE = [
  {
    title: '☀️ Morning Kickoff',
    timeBlock: 'morning',
    notifyAt: '09:30',
    items: [
      { id: 'm_texts', label: 'Check morning texts (skips/pricing)' },
      { id: 'm_team', label: 'Go see team (get photo/video)' }
    ]
  },
  {
    title: '☕ Midday Check-in',
    timeBlock: 'midday',
    notifyAt: '12:30',
    items: [
      { id: 'mid_texts', label: 'Check texts for updates' },
      { id: 'mid_va', label: 'Check items from VA' }
    ]
  },
  {
    title: '🌙 Close Down',
    timeBlock: 'evening',
    notifyAt: '16:00',
    items: [
      { id: 'close_schedule', label: 'Schedule & book tomorrow\'s jobs' },
      { id: 'close_texts', label: 'Check text messages' },
      { id: 'close_va', label: 'Check VA messages' }
    ]
  }
];

// --- COMPONENTS ---

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!auth) { setError("App not configured"); return; }
    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">versaBOT</h1>
          <p className="text-slate-400 text-sm">Business Manager</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-500 text-xs rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
            <div className="relative"><Mail className="w-5 h-5 absolute left-3 top-3 text-slate-400" /><input type="email" required className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}/></div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Password</label>
            <div className="relative"><Lock className="w-5 h-5 absolute left-3 top-3 text-slate-400" /><input type="password" required className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/></div>
          </div>
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
  const [analytics, setAnalytics] = useState(null);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [currentNotification, setCurrentNotification] = useState(null);

  const [firestoreData, setFirestoreData] = useState({
    gasUrl: '',
    targets: { monthly: 20000, weekly: 5000 },
    routine: { lastReset: '' }, 
    adhocTasks: [],
  });

  useEffect(() => {
    if (!isConfigured || !auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const today = new Date().toISOString().split('T')[0];

        if (!data.gasUrl) data.gasUrl = '';
        
        // Routine Reset Check
        if (data.routine?.lastReset !== today) {
          const resetRoutine = { lastReset: today };
          DAILY_ROUTINE.forEach(section => section.items.forEach(item => resetRoutine[item.id] = false));
          updateDoc(docRef, { routine: resetRoutine });
        } else {
          setFirestoreData(prev => ({ ...prev, ...data })); 
        }
      } else {
        // Init User
        const initialRoutine = { lastReset: new Date().toISOString().split('T')[0] };
        DAILY_ROUTINE.forEach(section => section.items.forEach(item => initialRoutine[item.id] = false));
        setDoc(docRef, {
          gasUrl: '',
          targets: { monthly: 20000, weekly: 5000 },
          routine: initialRoutine,
          adhocTasks: [],
        });
        setFirestoreData({ gasUrl: '', targets: { monthly: 20000, weekly: 5000 }, routine: initialRoutine, adhocTasks: [] });
      }
    });
    return () => unsubscribeSnapshot();
  }, [user]);

  // --- DATA PROCESSING (ANALYTICS ENGINE) ---
  const processMarketingData = (rawData) => {
    if (!rawData || rawData.length < 2) return null;

    const headers = rawData[0].map(h => h.toString().toLowerCase().trim());
    const idx = {
        source: headers.indexOf('source'),
        created: headers.indexOf('created'),
        lastDone: headers.indexOf('last done'), // Used for lost date
        state: headers.indexOf('state'),
        jobState: headers.indexOf('job state'), // Needed for "Empty" check
        service: headers.indexOf('services'),
        freq: headers.indexOf('frequency')
    };

    if (idx.source === -1 || idx.state === -1) return null;

    const sources = {};
    const validSources = ['LSA', 'Facebook Ads', 'Website', 'Leaflet', 'Canvassed', 'Social Media', 'Google'];

    // Initialize map
    validSources.forEach(s => sources[s] = { active: 0, churn: 0, lifespans: [] });
    sources['Other'] = { active: 0, churn: 0, lifespans: [] };

    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        // --- 1. DATE FILTER (2026+) ---
        const createdDate = new Date(row[idx.created]);
        if (isNaN(createdDate) || createdDate.getFullYear() < 2026) {
            continue; // Skip pre-2026 data
        }

        const rawSource = row[idx.source]?.toString().trim() || 'Other';
        // Normalize source name or bucket into 'Other'
        const sourceKey = validSources.find(s => s.toLowerCase() === rawSource.toLowerCase()) || 'Other';
        
        const state = row[idx.state]?.toString().trim().toLowerCase() || '';
        const jobState = row[idx.jobState]?.toString().trim().toLowerCase() || '';
        const service = row[idx.service]?.toString().toLowerCase() || '';
        const freq = row[idx.freq]?.toString().toLowerCase() || '';

        // Criteria: Window Cleaning + 4/8 weeks
        const isWindowCleaning = service.includes('window cleaning'); 
        const isValidFreq = freq.includes('4') || freq.includes('8');

        if (isWindowCleaning && isValidFreq) {
            // --- 2. ACTIVE CRITERIA: State='Active' AND JobState='Empty' ---
            if (state === 'active' && jobState === '') {
                sources[sourceKey].active++;
            } 
            // --- 3. CHURN CRITERIA: State='Inactive' ---
            else if (state === 'inactive') {
                sources[sourceKey].churn++;
                
                // Calculate Lifespan (Months)
                const last = new Date(row[idx.lastDone]);
                if (!isNaN(last)) {
                    const months = (last.getFullYear() - createdDate.getFullYear()) * 12 + (last.getMonth() - createdDate.getMonth());
                    if (months > 0) sources[sourceKey].lifespans.push(months);
                }
            }
        }
    }

    // Convert to Array for rendering
    return Object.entries(sources).map(([name, data]) => ({
        name,
        active: data.active,
        churn: data.churn,
        total: data.active + data.churn,
        retentionRate: data.active + data.churn > 0 ? Math.round((data.active / (data.active + data.churn)) * 100) : 0,
        avgLifetime: data.lifespans.length > 0 ? Math.round(data.lifespans.reduce((a,b) => a+b, 0) / data.lifespans.length) : 0
    })).sort((a,b) => b.active - a.active); // Sort by active count
  };

  const fetchLiveData = async () => {
    if (!firestoreData.gasUrl) return null;
    try {
      const secureUrl = `${firestoreData.gasUrl}?token=${GAS_TOKEN}`;
      const res = await fetch(secureUrl);
      const data = await res.json();
      if (!data.error) {
        setLiveData(data);
        if (data.marketing_raw) {
            const processed = processMarketingData(data.marketing_raw);
            setAnalytics(processed);
        }
      }
      return data;
    } catch (error) { return null; }
  };

  useEffect(() => { if (firestoreData.gasUrl) fetchLiveData(); }, [firestoreData.gasUrl]);

  // --- NOTIFICATIONS ---
  useEffect(() => {
    if (!firestoreData.routine) return;
    const checkNotifications = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      let currentBlock = '';
      if (hour >= 6 && hour < 12) currentBlock = 'morning';
      else if (hour >= 12 && hour < 17) currentBlock = 'midday';
      else if (hour >= 17 && hour < 22) currentBlock = 'evening';

      let pending = 0;
      let urgentPending = 0;
      DAILY_ROUTINE.forEach(section => {
        section.items.forEach(item => {
          if (!firestoreData.routine[item.id]) {
            pending++;
            if (section.timeBlock === currentBlock) urgentPending++;
            if (section.notifyAt === timeStr && 'Notification' in window && Notification.permission === 'granted') {
               new Notification(section.title, { body: `You have outstanding tasks for ${section.title}!` });
            }
          }
        });
      });
      setPendingTasksCount(pending);
      if (urgentPending > 0) {
        const titles = { morning: 'Morning Kickoff', midday: 'Midday Check-in', evening: 'Close Down' };
        setCurrentNotification(`${urgentPending} ${titles[currentBlock]} tasks pending!`);
      } else setCurrentNotification(null);
    };
    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [firestoreData.routine]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
  };

  // --- HANDLERS ---
  const handleSignOut = () => auth && signOut(auth).catch(e => console.error(e));
  
  const handleRoutineToggle = async (taskId) => {
    if (!user) return;
    const currentState = firestoreData.routine?.[taskId] || false;
    setFirestoreData(prev => ({ ...prev, routine: { ...prev.routine, [taskId]: !currentState } }));
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    try { await updateDoc(docRef, { [`routine.${taskId}`]: !currentState }); } catch(err) {}
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = formData.get('taskText');
    if (!text || !user) return;
    const newTask = { id: Date.now(), text: text, created: new Date().toISOString() };
    setFirestoreData(prev => ({ ...prev, adhocTasks: [...prev.adhocTasks, newTask] }));
    e.target.reset();
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    await updateDoc(docRef, { adhocTasks: arrayUnion(newTask) });
  };

  const handleDeleteTask = async (task) => {
    if (!user) return;
    setFirestoreData(prev => ({ ...prev, adhocTasks: prev.adhocTasks.filter(t => t.id !== task.id) }));
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    await updateDoc(docRef, { adhocTasks: arrayRemove(task) });
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    const updates = {
        gasUrl: firestoreData.gasUrl,
        'targets.monthly': Number(firestoreData.targets.monthly),
        'targets.weekly': Number(firestoreData.targets.weekly),
    };
    try { await updateDoc(docRef, updates); alert('Settings Saved'); fetchLiveData(); } 
    catch(err) { await setDoc(docRef, updates, { merge: true }); alert('Settings Saved'); fetchLiveData(); }
  };

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
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {currentNotification && <div onClick={() => setActiveTab('tasks')} className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-orange-100"><div className="p-2 bg-orange-100 rounded-full"><Bell className="w-5 h-5 text-orange-600 animate-bounce" /></div><div className="flex-1"><h3 className="font-bold text-orange-800 text-sm">Action Required</h3><p className="text-xs text-orange-700">{currentNotification}</p></div><div className="text-orange-400">→</div></div>}
            {!firestoreData.gasUrl && <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 items-start"><AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" /><div><h3 className="font-semibold text-yellow-800 text-sm">Setup Required</h3><p className="text-xs text-yellow-700 mt-1">Configure Data Source in settings.</p></div></div>}
            <div><h2 className="text-lg font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Performance</h2><ProgressBar label="Monthly Turnover" current={liveData?.financials?.turnover_mtd || 0} target={firestoreData.targets.monthly} /><ProgressBar label="Weekly Turnover" current={liveData?.financials?.turnover_wtd || 0} target={firestoreData.targets.weekly} /></div>
            <div className="grid grid-cols-2 gap-3"><KPICard title="Turnover MTD" value={fmt(liveData?.financials?.turnover_mtd)} /><KPICard title="Debtors Total" value={fmt(liveData?.financials?.debtors_total)} alert={(liveData?.financials?.debtors_total || 0) > 5000} /><KPICard title="New Cust Value" value={fmt(liveData?.customers?.new_value_4w)} subtext="This Month" /><KPICard title="Churn" value={liveData?.customers?.churn_count || 0} alert={(liveData?.customers?.churn_count || 0) > 0} subtext="Clients Lost" /></div>
          </div>
        )}

        {/* MARKETING ANALYTICS */}
        {activeTab === 'marketing' && (
          <div className="space-y-6">
             <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg">
                <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" /> Marketing Analytics</h2>
                <p className="text-xs opacity-70">2026 Onwards. Active = Empty Job State.</p>
             </div>

             {!analytics ? (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p className="text-xs">Processing data... (Ensure 'Sheet2' exists)</p>
                </div>
             ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                     <StatCard label="Total Active" value={analytics.reduce((a,b) => a + b.active, 0)} icon={Users} color="text-blue-600" />
                     <StatCard label="Avg Retention" value={`${Math.round(analytics.reduce((a,b) => a + b.retentionRate, 0) / analytics.length)}%`} icon={PieChart} color="text-green-600" />
                  </div>

                  <div>
                     <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2"><Database className="w-4 h-4 text-blue-600" /> Source Breakdown</h3>
                     <div className="space-y-3">
                        {analytics.map((source) => (
                           <SourceRow key={source.name} source={source.name} data={source} />
                        ))}
                     </div>
                  </div>
                </>
             )}
          </div>
        )}

        {/* TASKS */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {DAILY_ROUTINE.map((section, idx) => (<div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">{section.title}</h3><div className="space-y-3">{section.items.map((item) => { const isDone = firestoreData.routine?.[item.id] || false; return (<button key={item.id} onClick={() => handleRoutineToggle(item.id)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${isDone ? 'bg-slate-100 border-slate-200 text-slate-400 line-through' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}><span className="font-medium text-sm">{item.label}</span>{isDone ? <CheckSquare className="w-5 h-5 opacity-50" /> : <div className="w-5 h-5 rounded border border-slate-300" />} </button>); })}</div></div>))}
            <div><h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Ad-hoc Tasks</h3><form onSubmit={handleAddTask} className="flex gap-2 mb-4"><input name="taskText" placeholder="Add new task..." className="flex-1 p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="submit" className="bg-blue-600 text-white p-2 rounded-lg"><Plus className="w-5 h-5" /></button></form><div className="space-y-2">{firestoreData.adhocTasks.map((task) => (<div key={task.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm group"><span className="text-sm text-slate-700">{task.text}</span><button onClick={() => handleDeleteTask(task)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></div>))}{firestoreData.adhocTasks.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No pending tasks</p>}</div></div>
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
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</label>
                <div className="flex items-center justify-between"><span className="text-xs text-slate-600">Get alerts for pending tasks?</span><button type="button" onClick={requestNotificationPermission} className="px-3 py-1.5 rounded text-xs font-bold transition-colors bg-blue-600 text-white">Request Permission</button></div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors">Save Settings</button>
            </form>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe flex justify-between items-center z-20">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
          { id: 'marketing', icon: BarChart3, label: 'Analytics' }, 
          { id: 'tasks', icon: CheckSquare, label: 'Tasks', badge: pendingTasksCount > 0 },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'} relative`}>
            {item.badge && <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
