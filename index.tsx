import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './components/LandingPage';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const Main = () => {
  // Simple view state: 'landing' or 'fullscreen'
  const [view, setView] = useState<'landing' | 'fullscreen'>('landing');

  return (
    <React.StrictMode>
      {view === 'landing' ? (
        <LandingPage onOpenFullScreen={() => setView('fullscreen')} />
      ) : (
        <App onBack={() => setView('landing')} />
      )}
    </React.StrictMode>
  );
};

const root = ReactDOM.createRoot(rootElement);
root.render(<Main />);