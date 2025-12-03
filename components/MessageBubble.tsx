import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from '../types';
import { User, Bot, Smile, Plus } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onReact: (messageId: string, emoji: string) => void;
}

const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onReact }) => {
  const isUser = message.sender === Sender.User;
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPlacement, setPickerPlacement] = useState<'top' | 'bottom'>('top');
  
  const pickerRef = useRef<HTMLDivElement>(null);
  const bubbleContainerRef = useRef<HTMLDivElement>(null);

  // Format time (e.g., 14:30)
  const timeString = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Handle click outside to close picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const toggleReaction = (emoji: string) => {
    onReact(message.id, emoji);
    setShowPicker(false);
  };

  const handleTogglePicker = () => {
    if (!showPicker && bubbleContainerRef.current) {
      // Check distance from top of viewport to decide placement
      const rect = bubbleContainerRef.current.getBoundingClientRect();
      
      // If the message is near the top (less than 200px from top edge),
      // show the picker BELOW the message to avoid overlapping with header.
      if (rect.top < 200) {
        setPickerPlacement('bottom');
      } else {
        setPickerPlacement('top');
      }
    }
    setShowPicker(!showPicker);
  };

  return (
    <div className={`flex w-full mb-6 animate-slide-up group ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 relative`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-emerald-600 text-white'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble Container + Reactions */}
        <div className="flex flex-col relative" ref={bubbleContainerRef}>
          
          {/* Main Bubble */}
          <div className={`flex flex-col relative px-4 py-2 shadow-sm ${
            isUser 
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
              : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-none'
          } ${message.isError ? 'border-red-500 border-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : ''}`}>
            
            <div className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
              {message.text}
            </div>
            
            <span className={`text-[10px] mt-1 block opacity-70 ${isUser ? 'text-blue-100 text-left' : 'text-slate-400 text-right'}`}>
              {timeString}
            </span>

            {/* Reaction Button (Trigger) */}
            {!message.isError && (
              <div 
                className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  isUser 
                    ? '-left-8' 
                    : '-right-8'
                } h-full flex items-center`}
              >
                <button
                  onClick={handleTogglePicker}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 bg-gray-100 dark:bg-slate-700/50 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
                  title="Adicionar reação"
                >
                  <Smile size={16} />
                </button>
              </div>
            )}
            
            {/* Emoji Picker Popover */}
            {showPicker && (
              <div 
                ref={pickerRef}
                className={`absolute z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-full shadow-xl p-1.5 flex gap-1 animate-fade-in ${
                  isUser ? 'right-0' : 'left-0'
                } ${
                  pickerPlacement === 'top' 
                    ? 'bottom-full mb-2' 
                    : 'top-full mt-2'
                }`}
              >
                {AVAILABLE_REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-lg transition-transform hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Reactions Display */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {message.reactions.map((reaction, index) => (
                <button
                  key={`${reaction.emoji}-${index}`}
                  onClick={() => onReact(message.id, reaction.emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full border transition-colors ${
                    reaction.userReacted
                      ? 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-100'
                      : 'bg-white border-gray-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="font-medium">{reaction.count}</span>
                </button>
              ))}
              
              {/* Small add button next to reactions */}
              <button
                onClick={handleTogglePicker}
                className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all opacity-0 group-hover:opacity-100"
              >
                <Plus size={10} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;