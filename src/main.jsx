import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// --- CRASH REPORTER ---
// If the app fails to start, this will show the error on the screen.
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="color: red; padding: 20px; font-family: sans-serif;">
      <h1>⚠️ App Crashed</h1>
      <p><strong>Error:</strong> ${message}</p>
      <p><strong>File:</strong> ${source}</p>
      <p><strong>Line:</strong> ${lineno}</p>
    </div>
  `;
};

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (e) {
  document.getElementById('root').innerHTML = `
    <div style="color: red; padding: 20px;">
      <h1>⚠️ Startup Error</h1>
      <pre>${e.message}</pre>
    </div>
  `;
}
