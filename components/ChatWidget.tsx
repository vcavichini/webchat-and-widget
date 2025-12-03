import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import App from '../App';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 ${
          isOpen 
            ? 'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-white rotate-90' 
            : 'bg-blue-600 text-white hover:bg-blue-700 rotate-0'
        }`}
        aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      {/* Widget Container */}
      <div
        className={`fixed bottom-24 right-6 z-50 flex flex-col transition-all duration-300 ease-in-out transform origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
        }`}
        style={{
          width: '380px',
          height: '600px',
          maxHeight: 'calc(100vh - 120px)',
          maxWidth: 'calc(100vw - 48px)',
        }}
      >
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
          <App />
        </div>
      </div>
    </>
  );
};

export default ChatWidget;