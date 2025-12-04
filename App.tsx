import React, { useState, useEffect, useRef } from 'react';
import { Send, Moon, Sun, Monitor, MoreVertical, X, LogOut, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react';
import { Message, Sender, Theme, UserContext } from './types';
import { INITIAL_GREETING } from './constants';
import { sendMessageToN8N } from './services/n8nService';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';

interface AppProps {
  onBack?: () => void;
}

const App: React.FC<AppProps> = ({ onBack }) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>(Theme.System);
  const [showMenu, setShowMenu] = useState(false);
  
  // User Session State
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  
  // Login Form State
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Greeting
  useEffect(() => {
    // Only set greeting if it's the first load and empty (logic handled in login now)
  }, []);

  // Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === Theme.Dark ||
      (theme === Theme.System &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save preference
    localStorage.setItem('chat-theme', theme);
  }, [theme]);

  // Load saved theme and session
  useEffect(() => {
    const savedTheme = localStorage.getItem('chat-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedSession = localStorage.getItem('chat-user-context');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserContext(parsed);
        // If returning user, restore messages or show greeting
        setMessages([
            {
              id: 'init-1',
              text: `Bem-vindo de volta, ${parsed.name.split(' ')[0]}! \n${INITIAL_GREETING}`,
              sender: Sender.Bot,
              timestamp: new Date(),
              reactions: []
            },
        ]);
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (userContext) {
        scrollToBottom();
    }
  }, [messages, isLoading, userContext]);

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim() || !tempEmail.trim()) return;

    const newContext: UserContext = {
        name: tempName,
        email: tempEmail,
        sessionId: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() // Fallback for older browsers
    };

    setUserContext(newContext);
    localStorage.setItem('chat-user-context', JSON.stringify(newContext));

    setMessages([
        {
          id: 'init-1',
          text: `Olá, ${tempName.split(' ')[0]}! \n${INITIAL_GREETING}`,
          sender: Sender.Bot,
          timestamp: new Date(),
          reactions: []
        },
    ]);
  };

  const handleLogout = () => {
    setUserContext(null);
    localStorage.removeItem('chat-user-context');
    setMessages([]);
    setShowMenu(false);
    setTempName('');
    setTempEmail('');
  };

  const handleSend = async () => {
    if (!input.trim() || !userContext) return;

    const userText = input.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: Sender.User,
      timestamp: new Date(),
      reactions: []
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToN8N(userText, userContext);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: Sender.Bot,
        timestamp: new Date(),
        reactions: []
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const errorText = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : "Erro desconhecido ao processar mensagem.";

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `❌ ${errorText}`,
        sender: Sender.Bot,
        timestamp: new Date(),
        isError: true,
        reactions: []
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus back on input for desktop users mainly
      if (window.matchMedia('(min-width: 768px)').matches) {
          inputRef.current?.focus();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages((prevMessages) => 
      prevMessages.map((msg) => {
        if (msg.id !== messageId) return msg;

        const existingReactions = msg.reactions || [];
        const reactionIndex = existingReactions.findIndex((r) => r.emoji === emoji);

        let newReactions;

        if (reactionIndex >= 0) {
          // Reaction exists, toggle it
          newReactions = [...existingReactions];
          const currentReaction = newReactions[reactionIndex];
          
          if (currentReaction.userReacted) {
            // Remove reaction if count becomes 0, otherwise just decrement
            if (currentReaction.count <= 1) {
               newReactions.splice(reactionIndex, 1);
            } else {
               newReactions[reactionIndex] = {
                 ...currentReaction,
                 count: currentReaction.count - 1,
                 userReacted: false
               };
            }
          } else {
            // Add to existing count
            newReactions[reactionIndex] = {
              ...currentReaction,
              count: currentReaction.count + 1,
              userReacted: true
            };
          }
        } else {
          // New reaction
          newReactions = [
            ...existingReactions,
            { emoji, count: 1, userReacted: true }
          ];
        }

        return { ...msg, reactions: newReactions };
      })
    );
  };

  const clearChat = () => {
     if (!userContext) return;
     setMessages([
      {
        id: Date.now().toString(),
        text: `Vamos recomeçar, ${userContext.name.split(' ')[0]}! \nComo posso ajudar?`,
        sender: Sender.Bot,
        timestamp: new Date(),
        reactions: []
      },
    ]);
    setShowMenu(false);
  };

  // Render Login Form (Pre-chat)
  if (!userContext) {
      return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 shadow-xl overflow-hidden relative">
            {/* Minimal Header */}
            <header className="flex-none px-6 py-6 flex justify-between items-center z-20">
                <div className="flex items-center gap-2">
                    {onBack && (
                      <button onClick={onBack} className="mr-2 text-slate-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={24} />
                      </button>
                    )}
                    <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                        <MessageSquare size={20} />
                    </div>
                    <span className="font-bold text-lg text-slate-800 dark:text-white">Assistente</span>
                </div>
                {/* Theme Toggle (Mini) */}
                <button 
                    onClick={() => setTheme(theme === Theme.Dark ? Theme.Light : Theme.Dark)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    {theme === Theme.Dark ? <Sun size={20}/> : <Moon size={20} />}
                </button>
            </header>

            <main className="flex-1 px-8 flex flex-col justify-center animate-fade-in pb-12">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Olá! 👋</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Preencha seus dados para iniciar o atendimento personalizado.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nome</label>
                        <input 
                            type="text" 
                            required
                            placeholder="Seu nome"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">E-mail</label>
                        <input 
                            type="email" 
                            required
                            placeholder="seu@email.com"
                            value={tempEmail}
                            onChange={(e) => setTempEmail(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group mt-2"
                    >
                        Iniciar Conversa
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </main>
            
            <div className="p-4 text-center text-xs text-slate-300 dark:text-slate-600">
                Powered by BotLab
            </div>
        </div>
      );
  }

  // Render Chat Interface
  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-slate-900 shadow-xl overflow-hidden relative">
      
      {/* Header */}
      <header className="flex-none bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
            {onBack && (
                <button onClick={onBack} className="mr-1 text-slate-500 hover:text-blue-600 transition-colors">
                  <ArrowLeft size={20} />
                </button>
            )}
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div>
                <h1 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">Assistente</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                    {userContext.email}
                </p>
            </div>
        </div>

        <div className="flex items-center gap-2">
            {/* Theme Toggle Group */}
            <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-1 flex items-center hidden sm:flex">
                <button 
                    onClick={() => setTheme(Theme.Light)}
                    className={`p-1.5 rounded-md transition-all ${theme === Theme.Light ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="Modo Claro"
                >
                    <Sun size={14} />
                </button>
                 <button 
                    onClick={() => setTheme(Theme.System)}
                    className={`p-1.5 rounded-md transition-all ${theme === Theme.System ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="Sistema"
                >
                    <Monitor size={14} />
                </button>
                <button 
                    onClick={() => setTheme(Theme.Dark)}
                    className={`p-1.5 rounded-md transition-all ${theme === Theme.Dark ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="Modo Escuro"
                >
                    <Moon size={14} />
                </button>
            </div>

            {/* Menu Button (Mobile/Options) */}
            <div className="relative">
                <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                    {showMenu ? <X size={20} /> : <MoreVertical size={20} />}
                </button>
                
                {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 py-1 overflow-hidden animate-fade-in origin-top-right z-30">
                        <button 
                            onClick={clearChat}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                        >
                            <MessageSquare size={14} />
                            Limpar mensagens
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-slate-700 my-1"></div>
                        <button 
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                        >
                            <LogOut size={14} />
                            Sair / Trocar conta
                        </button>
                    </div>
                )}
            </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth" id="chat-container">
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            onReact={handleReaction} 
          />
        ))}
        
        {isLoading && (
            <div className="flex w-full justify-start animate-fade-in">
                <div className="flex max-w-[75%] flex-row items-end gap-2">
                     {/* Placeholder Avatar for loading */}
                     <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600/50 flex items-center justify-center text-white/50">
                        <div className="w-4 h-4 rounded-full border-2 border-white/50"></div>
                     </div>
                    <TypingIndicator />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 z-20">
        <div className="relative flex items-center gap-2">
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite..."
                disabled={isLoading}
                className="w-full bg-gray-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 rounded-full py-2.5 pl-4 pr-10 outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
            <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`absolute right-1 p-1.5 rounded-full transition-all duration-200 ${
                    !input.trim() || isLoading
                    ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform active:scale-95'
                }`}
                aria-label="Enviar mensagem"
            >
                <Send size={16} />
            </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
               Powered by BotLab
            </p>
        </div>
      </footer>

    </div>
  );
};

export default App;