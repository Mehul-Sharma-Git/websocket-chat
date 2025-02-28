import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { Send } from 'lucide-react';

const ChatInput: React.FC = () => {
  const { sendMessage, setTyping } = useChat();
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    sendMessage(message.trim());
    setMessage('');
    
    // Clear typing indicator when message is sent
    setTyping(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Set typing indicator
    setTyping(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to clear typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex items-center p-3 border-t border-gray-200">
      <input
        type="text"
        className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Type a message..."
        value={message}
        onChange={handleChange}
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md"
        disabled={!message.trim()}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
};

export default ChatInput;