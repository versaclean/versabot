import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, MessageSquare, CheckSquare, Settings, Send, Plus, Trash2, 
  RefreshCw, Loader2, TrendingUp, AlertCircle, LogOut, Mail, Lock, UserPlus, 
  LogIn, Brain, Cpu, Database, Video, Scissors, Camera, Smartphone, Bell
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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
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
    items: [
      { id: 'm_texts', label: 'Check morning texts (skips/pricing)' },
      { id: 'm_team', label: 'Go see team (get photo/video)' }
    ]
  },
  {
    title: '☕ Midday Check-in',
    timeBlock: 'midday',
    items: [
      { id: 'mid_texts', label: 'Check texts for updates' },
      { id: 'mid_va', label: 'Check items from VA' }
    ]
  },
  {
    title: '🌙 Close Down',
    timeBlock: 'evening',
    items: [
      { id: 'close_schedule', label: 'Schedule & book tomorrow\'s jobs' }
    ]
  }
];

const SHOOTING_LIST = [
  { id: 'shot_a', title: 'Shot A: The Arrival', desc: 'Van pulling up or walking up drive.', time: '15 secs' },
  { id: 'shot_b', title: 'Shot B: Squeegee/Brush Close-up', desc: 'Pure cleaning action. Focus on sound.', time: '5 mins total' },
  { id: 'shot_c', title: 'Shot C: The "Odd Job"', desc: 'Cleaning a local sign, postbox, or bench.', time: '30 secs' },
  { id: 'shot_d', title: 'Shot D: Service Promise', desc: 'Talk to camera: "24h re-clean guarantee..."', time: '30 secs' },
  { id: 'shot_e', title: 'Shot E: Virtual Quote', desc: 'Walkaround of 3-bed/4-bed. State price.', time: '60 secs' },
  { id: 'shot_f', title: 'Shot F: Before/Afters', desc: '5 sets of static photos from exact same angle.', time: 'Photos' }
];

const EDITING_STRATEGY = {
  Mon: {
    title: 'The "Satisfying" Hook',
    subject: 'Close-up of heavy dirt being removed (Glass/Frames).',
    platforms: [
      { name: 'TikTok', style: 'Jump Cuts. <10s.', audio: 'Raw Sound Only', text: 'Yellow Text: "Satisfying? 🤤" #asmr #windowcleaning' },
      { name: 'Instagram', style: 'Continuous 15s shot. Vibrant filter.', audio: 'Trending Chill (15%)', text: '"Monday Morning Views" #[Town] #cleaningmotivation' },
      { name: 'Facebook', style: 'Split Screen (Dirty top/Clean bottom).', audio: 'N/A', text: '"Starting the week right in [Town]! Who needs a clear view?"' }
    ]
  },
  Tue: {
    title: 'The "Team & Arrival"',
    subject: 'Team arriving at house and setting up.',
    platforms: [
      { name: 'TikTok', style: 'POV. Fast-forward walking.', audio: 'Upbeat, fast-paced.', text: '"POV: You hired the best in [Town]" #dayinthelife #smallbiz' },
      { name: 'Instagram', style: 'Aesthetic B-Roll. Slow-mo logo.', audio: 'Motivational Music', text: 'Use Location Sticker for [Town]' },
      { name: 'Facebook', style: 'Photo of van on nice street.', audio: 'N/A', text: '"Look out for the van in [Street/Area] today! 👋"' }
    ]
  },
  Wed: {
    title: 'The "Hero" Odd-Job',
    subject: 'Cleaning a local sign, postbox, or bench.',
    platforms: [
      { name: 'TikTok', style: 'Transformation. 2s dirt -> Flash -> Clean.', audio: 'Wow/Surprise Sound', text: '"Giving back to [Town]" #community #restoration' },
      { name: 'Instagram', style: 'Before & After Slider (2 slides).', audio: 'Calm, rhythmic beat', text: '"Local restoration project. Love where you live."' },
      { name: 'Facebook', style: 'Full video (30-60s). Explain why.', audio: 'Voiceover', text: 'Share to 3 local groups: "Thought [Sign] needed TLC! Hope you like it."' }
    ]
  },
  Thu: {
    title: 'The "Pro Knowledge"',
    subject: 'Explaining kit (Pure water, poles, rain).',
    platforms: [
      { name: 'TikTok', style: 'Green Screen over rainy window.', audio: 'Voiceover + Auto-Captions', text: '"Window Cleaner Secrets 🤫"' },
      { name: 'Instagram', style: 'Educational Reel (3-4 clips).', audio: 'Low background music', text: 'Question Sticker: "Did you know this?"' },
      { name: 'Facebook', style: 'Long post with kit photo.', audio: 'N/A', text: '"Why we don\'t use tap water... (and why it saves you money)."' }
    ]
  },
  Fri: {
    title: 'The "Virtual Quote"',
    subject: 'Walking around a house stating price.',
    platforms: [
      { name: 'TikTok', style: 'Fast-paced. Cut to windows.', audio: 'Business/Money Theme', text: '"How much for a 3-bed semi?" #pricing #transparency' },
      { name: 'Instagram', style: 'Professional/Bright. Text boxes.', audio: 'Professional Upbeat', text: '"DM for a custom quote 📩"' },
      { name: 'Facebook', style: 'No edits. Continuous walkaround.', audio: 'Raw Authenticity', text: '"Example pricing for [House] in [Town]. 2 slots left!"' }
    ]
  }
};

const getCurrentSunday = () => {
  const d = new Date();
  const day = d.getDay(); 
  const diff = d.getDate() - day; 
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().split('T')[0];
};

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

const KPICard = ({ title, value, subtext, alert }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col">
    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
    <h3 className={`text-2xl font-bold ${alert ? 'text-red-500' : 'text-slate-800'}`}>{value}</h3>
    {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
  </div>
);

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
  const [marketingDay, setMarketingDay] = useState('Mon');
  const [liveData, setLiveData] = useState(null); 
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [currentNotification, setCurrentNotification] = useState(null);

  const [firestoreData, setFirestoreData] = useState({
    gasUrl: '',
    targets: { monthly: 20000, weekly: 5000 },
    routine: { lastReset: '' }, 
    marketing: { lastReset: '' },
    adhocTasks: [],
    botInstructions: '',
    aiModel: 'gemini-1.5-flash'
  });

  const [messages, setMessages] = useState([{ role: 'system', text: 'Hello! I am ready to analyze your business data.' }]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

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
        const today = new Date().toISOString().split('T')[0];
        const currentSunday = getCurrentSunday();
        if (!data.gasUrl) data.gasUrl = '';
        
        let needsUpdate = false;
        let newData = { ...data };

        if (data.routine?.lastReset !== today) {
          const resetRoutine = { lastReset: today };
          DAILY_ROUTINE.forEach(section => section.items.forEach(item => resetRoutine[item.id] = false));
          newData.routine = resetRoutine;
          needsUpdate = true;
        }

        if (data.marketing?.lastReset !== currentSunday) {
          const resetMarketing = { lastReset: currentSunday };
          SHOOTING_LIST.forEach(item => resetMarketing[item.id] = false);
          ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(d => resetMarketing[`edit_${d}`] = false);
          newData.marketing = resetMarketing;
          needsUpdate = true;
        }

        if (needsUpdate) updateDoc(docRef, newData);
        else setFirestoreData(prev => ({ ...prev, ...data })); 

      } else {
        const initialRoutine = { lastReset: new Date().toISOString().split('T')[0] };
        DAILY_ROUTINE.forEach(section => section.items.forEach(item => initialRoutine[item.id] = false));
        const initialMarketing = { lastReset: getCurrentSunday() };
        SHOOTING_LIST.forEach(item => initialMarketing[item.id] = false);
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(d => initialMarketing[`edit_${d}`] = false);

        const initialData = {
          gasUrl: '', targets: { monthly: 20000, weekly: 5000 },
          routine: initialRoutine, marketing: initialMarketing,
          adhocTasks: [], botInstructions: '', aiModel: 'gemini-1.5-flash'
        };
        setDoc(docRef, initialData);
        setFirestoreData(initialData);
      }
    });
    return () => unsubscribeSnapshot();
  }, [user]);

  useEffect(() => {
    if (!firestoreData.routine) return;
    const hour = new Date().getHours();
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
        }
      });
    });
    setPendingTasksCount(pending);
    if (urgentPending > 0) {
      const titles = { morning: 'Morning Kickoff', midday: 'Midday Check-in', evening: 'Close Down' };
      setCurrentNotification(`${urgentPending} ${titles[currentBlock]} tasks pending!`);
    } else setCurrentNotification(null);
  }, [firestoreData.routine]);

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

  const handleSignOut = () => { if (auth) signOut(auth).catch(e => console.error(e)); };

  const handleRoutineToggle = async (taskId) => {
    if (!user) return;
    const currentState = firestoreData.routine?.[taskId] || false;
    setFirestoreData(prev => ({ ...prev, routine: { ...prev.routine, [taskId]: !currentState } }));
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    try { await updateDoc(docRef, { [`routine.${taskId}`]: !currentState }); } catch(err) {}
  };

  const handleMarketingToggle = async (taskId) => {
    if (!user) return;
    const currentState = firestoreData.marketing?.[taskId] || false;
    setFirestoreData(prev => ({ ...prev, marketing: { ...prev.marketing, [taskId]: !currentState } }));
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    try { await updateDoc(docRef, { [`marketing.${taskId}`]: !currentState }); } 
    catch(err) { if (err.code === 'not-found') await setDoc(docRef, { marketing: { [taskId]: !currentState } }, { merge: true }); }
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
        botInstructions: firestoreData.botInstructions || '',
        aiModel: firestoreData.aiModel || 'gemini-1.5-flash'
    };
    try { await updateDoc(docRef, updates); alert('Settings Saved'); fetchLiveData(); } 
    catch(err) { await setDoc(docRef, updates, { merge: true }); alert('Settings Saved'); fetchLiveData(); }
  };

  const arrayToCSV = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    return arr.map(row => row.join(",")).join("\n");
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    let currentData = liveData;
    try { const freshData = await fetchLiveData(); if (freshData) currentData = freshData; } catch (e) {}
    const rawCSV = arrayToCSV(currentData?.raw_context || []);
    const systemPrompt = `You are versaBOT. Rules: ${firestoreData.botInstructions}. Financials: ${JSON.stringify(currentData?.financials)}. Context(CSV): ${rawCSV}. Answer in GBP.`;
    const modelId = firestoreData.aiModel || 'gemini-1.5-flash';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); 
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\n\nUser Question: " + userMsg.text }] }] }),
          signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data.error) setMessages(prev => [...prev, { role: 'ai', text: `API Error: ${data.error.message}` }]);
      else setMessages(prev => [...prev, { role: 'ai', text: data.candidates?.[0]?.content?.parts?.[0]?.text || "Error." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: error.name === 'AbortError' ? "Timed Out." : "Connection Error." }]);
    } finally { setIsTyping(false); }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeTab]);
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
            {currentNotification && <div onClick={() => setActiveTab('tasks')} className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-orange-100"><div className="p-2 bg-orange-100 rounded-full"><Bell className="w-5 h-5 text-orange-600" /></div><div className="flex-1"><h3 className="font-bold text-orange-800 text-sm">Action Required</h3><p className="text-xs text-orange-700">{currentNotification}</p></div><div className="text-orange-400">→</div></div>}
            {!firestoreData.gasUrl && <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 items-start"><AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" /><div><h3 className="font-semibold text-yellow-800 text-sm">Setup Required</h3><p className="text-xs text-yellow-700 mt-1">Configure Data Source.</p></div></div>}
            <div><h2 className="text-lg font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Performance</h2><ProgressBar label="Monthly Turnover" current={liveData?.financials?.turnover_mtd || 0} target={firestoreData.targets.monthly} /><ProgressBar label="Weekly Turnover" current={liveData?.financials?.turnover_wtd || 0} target={firestoreData.targets.weekly} /></div>
            <div className="grid grid-cols-2 gap-3"><KPICard title="Turnover MTD" value={fmt(liveData?.financials?.turnover_mtd)} /><KPICard title="Debtors Total" value={fmt(liveData?.financials?.debtors_total)} alert={(liveData?.financials?.debtors_total || 0) > 5000} /><KPICard title="New Cust Value" value={fmt(liveData?.customers?.new_value_4w)} subtext="This Month" /><KPICard title="Churn" value={liveData?.customers?.churn_count || 0} alert={(liveData?.customers?.churn_count || 0) > 0} subtext="Clients Lost" /></div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">{messages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>{m.text}</div></div>)}{isTyping && <div className="flex justify-start"><div className="bg-slate-100 p-3 rounded-2xl rounded-bl-none"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div></div>}<div ref={chatEndRef} /></div>
            <div className="flex gap-2"><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask about your data..." className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600" /><button onClick={handleSendMessage} disabled={!chatInput.trim()} className="p-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"><Send className="w-5 h-5" /></button></div>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-6 pb-6">
            <div className="bg-slate-800 text-white p-4 rounded-xl shadow-md">
              <h2 className="font-bold flex items-center gap-2 mb-3 text-sm uppercase tracking-wider"><Smartphone className="w-4 h-4" /> Platform Vibe Shift</h2>
              <div className="grid grid-cols-1 gap-2 text-xs opacity-90">
                <div className="flex items-center gap-2"><span className="bg-black text-white px-1.5 rounded">TikTok</span> High Speed. Auto-Captions. Bold/Yellow.</div>
                <div className="flex items-center gap-2"><span className="bg-pink-600 text-white px-1.5 rounded">IG</span> 30fps. Lofi Filter. "Link in Bio" sticker.</div>
                <div className="flex items-center gap-2"><span className="bg-blue-600 text-white px-1.5 rounded">FB</span> Raw/Genuine. No filters. Tag Town/Area.</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-2"><Camera className="w-5 h-5 text-blue-600" /><h2 className="font-bold text-slate-800">1. Raw Footage List</h2></div>
              <div className="p-2 space-y-1">{SHOOTING_LIST.map((task) => { const isDone = firestoreData.marketing?.[task.id] || false; return (<div key={task.id} onClick={() => handleMarketingToggle(task.id)} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${isDone ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50'}`}>{isDone ? <CheckSquare className="w-5 h-5 text-green-500 shrink-0" /> : <div className="w-5 h-5 rounded border-2 border-slate-300 shrink-0" />}<div className="flex-1"><div className="flex justify-between"><span className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</span><span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{task.time}</span></div><p className="text-xs text-slate-500 mt-0.5">{task.desc}</p></div></div>)})}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center"><div className="flex items-center gap-2"><Scissors className="w-5 h-5 text-purple-600" /><h2 className="font-bold text-slate-800">2. Editing Schedule</h2></div></div>
              <div className="flex border-b border-slate-100 overflow-x-auto">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (<button key={day} onClick={() => setMarketingDay(day)} className={`flex-1 py-3 text-xs font-bold transition-colors ${marketingDay === day ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'}`}>{day}</button>))}</div>
              <div className="p-4">
                <div className="mb-4"><h3 className="text-lg font-bold text-slate-800">{EDITING_STRATEGY[marketingDay].title}</h3><p className="text-sm text-slate-500 mt-1">{EDITING_STRATEGY[marketingDay].subject}</p></div>
                <div className="space-y-3">{EDITING_STRATEGY[marketingDay].platforms.map((platform, idx) => (<div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100"><div className="flex items-center gap-2 mb-2"><span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded ${platform.name === 'TikTok' ? 'bg-black' : platform.name === 'Instagram' ? 'bg-pink-600' : 'bg-blue-600'}`}>{platform.name}</span></div><div className="grid grid-cols-1 gap-2 text-xs"><div className="flex gap-2"><span className="font-bold w-10 shrink-0 text-slate-400">Style:</span> <span className="text-slate-700">{platform.style}</span></div><div className="flex gap-2"><span className="font-bold w-10 shrink-0 text-slate-400">Audio:</span> <span className="text-slate-700">{platform.audio}</span></div><div className="flex gap-2"><span className="font-bold w-10 shrink-0 text-slate-400">Tags:</span> <span className="text-blue-600 font-medium">{platform.text}</span></div></div></div>))}</div>
                <button onClick={() => handleMarketingToggle(`edit_${marketingDay}`)} className={`mt-4 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${firestoreData.marketing?.[`edit_${marketingDay}`] ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{firestoreData.marketing?.[`edit_${marketingDay}`] ? <> <CheckSquare className="w-5 h-5" /> Completed for {marketingDay} </> : "Mark Day Complete"}</button>
              </div>
            </div>
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
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Cpu className="w-4 h-4" /> AI Model ID (Advanced)</label><input value={firestoreData.aiModel} onChange={(e) => setFirestoreData({...firestoreData, aiModel: e.target.value})} placeholder="gemini-1.5-flash" className="w-full p-3 rounded-lg border border-slate-200 text-sm" /><p className="text-[10px] text-slate-400 mt-1">If the bot stops working, try: gemini-1.5-pro or gemini-2.0-flash-exp</p></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Brain className="w-4 h-4" /> Bot Instructions (Memory)</label><textarea value={firestoreData.botInstructions} onChange={(e) => setFirestoreData({...firestoreData, botInstructions: e.target.value})} placeholder="e.g., Active customers have 'Live' in Column C. Treat 'Skip' messages as urgent." className="w-full p-3 rounded-lg border border-slate-200 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-blue-600" /><div className="mt-2 p-2 bg-slate-100 rounded text-[10px] text-slate-500 flex items-center gap-2"><Database className="w-3 h-3" /><span>Rows Loaded: {liveData?.raw_context?.length || 0}{(!liveData?.raw_context || liveData.raw_context.length === 0) && " (Warning: Check Google Sheet)"}</span></div></div>
              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors">Save Settings</button>
            </form>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe flex justify-between items-center z-20">
        {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Home' }, { id: 'chat', icon: MessageSquare, label: 'Chat' }, { id: 'marketing', icon: Video, label: 'Content' }, { id: 'tasks', icon: CheckSquare, label: 'Tasks', badge: pendingTasksCount > 0 }, { id: 'settings', icon: Settings, label: 'Settings' }].map((item) => (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'} relative`}>{item.badge && <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}<item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} /><span className="text-[10px] font-medium">{item.label}</span></button>))}
      </nav>
    </div>
  );
}

export default App;
