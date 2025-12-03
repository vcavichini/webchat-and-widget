import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex space-x-1 p-4 bg-gray-200 dark:bg-slate-700 rounded-2xl rounded-tl-none w-fit items-center h-10 animate-fade-in">
      <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
    </div>
  );
};

export default TypingIndicator;