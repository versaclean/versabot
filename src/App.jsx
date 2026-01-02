import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  CheckSquare, 
  Settings, 
  Send, 
  Plus, 
  Trash2, 
  RefreshCw,
  Loader2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCM_GhAUBAQCdri9IM0G8tgRBPtgtg30Rc",
  authDomain: "versabot-2710b.firebaseapp.com",
  projectId: "versabot-2710b",
  storageBucket: "versabot-2710b.firebasestorage.app",
  messagingSenderId: "1083692717600",
  appId: "1:1083692717600:web:81a98547cbe3c2a54c0e45"
};

const APP_ID = 'versabot-pwa-v1';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const KPICard = ({ title, value, subtext, alert }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col">
    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
    <h3 className={`text-2xl font-bold ${alert ? 'text-red-500' : 'text-slate-800'}`}>
      {value}
    </h3>
    {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
  </div>
);

const ProgressBar = ({ current, target, label }) => {
  const percentage = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">
          {percentage.toFixed(1)}% of {target.toLocaleString()}
        </span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [liveData, setLiveData] = useState(null); 
  const [firestoreData, setFirestoreData] = useState({
    gasUrl: '[https://script.google.com/macros/s/AKfycbxXfk5GEP75eDjI51QSCB3kjBUllTAQjM3qs64lsPYORoco3ztrKuYe6q-TLy7Dd-aooA/exec](https://script.google.com/macros/s/AKfycbxXfk5GEP75eDjI51QSCB3kjBUllTAQjM3qs64lsPYORoco3ztrKuYe6q-TLy7Dd-aooA/exec)',
    targets: { monthly: 20000, weekly: 5000 },
    routine: { morning: false, midday: false, evening: false, lastReset: '' },
    adhocTasks: []
  });

  const [messages, setMessages] = useState([
    { role: 'system', text: 'Hello! I am ready to analyze your business data.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch((error) => console.error("Auth Error:", error));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');

    const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const today = new Date().toISOString().split('T')[0];
        
        if (!data.gasUrl) {
            data.gasUrl = '[https://script.google.com/macros/s/AKfycbxXfk5GEP75eDjI51QSCB3kjBUllTAQjM3qs64lsPYORoco3ztrKuYe6q-TLy7Dd-aooA/exec](https://script.google.com/macros/s/AKfycbxXfk5GEP75eDjI51QSCB3kjBUllTAQjM3qs64lsPYORoco3ztrKuYe6q-TLy7Dd-aooA/exec)';
        }

        if (data.routine?.lastReset !== today) {
          updateDoc(docRef, {
            'routine.morning': false,
            'routine.midday': false,
            'routine.evening': false,
            'routine.lastReset': today
          });
        } else {
          setFirestoreData(data);
        }
      } else {
        const initialData = {
          gasUrl: '[https://script.google.com/macros/s/AKfycbxXfk5GEP75eDjI51QSCB3kjBUllTAQjM3qs64lsPYORoco3ztrKuYe6q-TLy7Dd-aooA/exec](https://script.google.com/macros/s/AKfycbxXfk5GEP75eDjI51QSCB3kjBUllTAQjM3qs64lsPYORoco3ztrKuYe6q-TLy7Dd-aooA/exec)',
          targets: { monthly: 0, weekly: 0 },
          routine: { 
            morning: false, 
            midday: false, 
            evening: false, 
            lastReset: new Date().toISOString().split('T')[0] 
          },
          adhocTasks: []
        };
        setDoc(docRef, initialData);
        setFirestoreData(initialData);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  const fetchLiveData = async () => {
    if (!firestoreData.gasUrl) return;
    
    try {
      const res = await fetch(firestoreData.gasUrl);
      const data = await res.json();
      setLiveData(data);
    } catch (error) {
      console.error("GAS Fetch Error:", error);
      setLiveData(null); 
    }
  };

  useEffect(() => {
    if (firestoreData.gasUrl) {
      fetchLiveData();
    }
  }, [firestoreData.gasUrl]);

  const handleRoutineToggle = async (key) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    await updateDoc(docRef, {
      [`routine.${key}`]: !firestoreData.routine[key]
    });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = formData.get('taskText');
    if (!text || !user) return;

    const newTask = {
        id: Date.now(),
        text: text,
        created: new Date().toISOString()
    };

    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    await updateDoc(docRef, {
      adhocTasks: arrayUnion(newTask)
    });
    e.target.reset();
  };

  const handleDeleteTask = async (task) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    await updateDoc(docRef, {
      adhocTasks: arrayRemove(task)
    });
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    if (!user) return;

    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'main');
    await updateDoc(docRef, {
      gasUrl: formData.get('gasUrl'),
      'targets.monthly': Number(formData.get('targetMonthly')),
      'targets.weekly': Number(formData.get('targetWeekly')),
    });
    alert('Settings Saved');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    const contextData = liveData ? JSON.stringify(liveData) : "No live data available currently.";
    const contextTargets = JSON.stringify(firestoreData.targets);
    
    const systemPrompt = `
      You are versaBOT, a business assistant. 
      Current Business Data: ${contextData}.
      Targets: ${contextTargets}.
      Answer concisely.
    `;

    try {
      const apiKey = "AIzaSyB4Y-auFWVw2mcCkweDcRc3bUZIUdYwdEo";
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + "\n\nUser Question: " + userMsg.text }] }]
          })
        }
      );
      
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI service." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Booting versaBOT...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans text-slate-900">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          versaBOT
        </h1>
        {activeTab === 'dashboard' && (
          <button onClick={fetchLiveData} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        )}
      </div>

      <main className="p-4 max-w-2xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {!firestoreData.gasUrl && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-800 text-sm">Setup Required</h3>
                        <p className="text-xs text-yellow-700 mt-1">Please configure your Data Source URL in settings to see live metrics.</p>
                    </div>
                </div>
            )}

            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Performance
              </h2>
              <ProgressBar 
                label="Monthly Turnover" 
                current={liveData?.turnoverMTD || 0} 
                target={firestoreData.targets.monthly} 
              />
              <ProgressBar 
                label="Weekly Turnover" 
                current={liveData?.turnoverWTD || 0} 
                target={firestoreData.targets.weekly} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <KPICard 
                title="Turnover MTD" 
                value={`$${(liveData?.turnoverMTD || 0).toLocaleString()}`} 
              />
              <KPICard 
                title="Debtors Total" 
                value={`$${(liveData?.debtors || 0).toLocaleString()}`} 
                alert={(liveData?.debtors || 0) > 5000}
              />
              <KPICard 
                title="New Clients" 
                value={liveData?.newCustomers || 0} 
                subtext="This Month"
              />
              <KPICard 
                title="Churn" 
                value={liveData?.churnCount || 0} 
                alert={(liveData?.churnCount || 0) > 0}
                subtext="Clients Lost"
              />
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 p-3 rounded-2xl rounded-bl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about your data..."
                className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="p-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Daily Routine</h3>
              <div className="space-y-3">
                {['morning', 'midday', 'evening'].map((time) => (
                  <button
                    key={time}
                    onClick={() => handleRoutineToggle(time)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                      firestoreData.routine[time] 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="capitalize font-medium">{time} Check</span>
                    {firestoreData.routine[time] && <CheckSquare className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Ad-hoc Tasks</h3>
              <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input 
                  name="taskText"
                  placeholder="Add new task..."
                  className="flex-1 p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg">
                  <Plus className="w-5 h-5" />
                </button>
              </form>
              
              <div className="space-y-2">
                {firestoreData.adhocTasks.map((task) => (
                  <div key={task.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm group">
                    <span className="text-sm text-slate-700">{task.text}</span>
                    <button 
                      onClick={() => handleDeleteTask(task)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {firestoreData.adhocTasks.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-4">No pending tasks</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Configuration</h2>
            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Google Apps Script URL</label>
                <input 
                  name="gasUrl"
                  defaultValue={firestoreData.gasUrl}
                  placeholder="[https://script.google.com/](https://script.google.com/)..."
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Monthly Target ($)</label>
                  <input 
                    name="targetMonthly"
                    type="number"
                    defaultValue={firestoreData.targets.monthly}
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Weekly Target ($)</label>
                  <input 
                    name="targetWeekly"
                    type="number"
                    defaultValue={firestoreData.targets.weekly}
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
                Save Settings
              </button>
            </form>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe flex justify-between items-center z-20">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
          { id: 'chat', icon: MessageSquare, label: 'Chat' },
          { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === item.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
