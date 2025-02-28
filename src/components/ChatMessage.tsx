import React from 'react';
import { Message } from '../types';
import { useChat } from '../context/ChatContext';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useChat();
  const isCurrentUser = user?.id === message.user.id;
  const isSystem = message.type === 'system' || message.user.id === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-2">
          <img
            src={message.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.user.id}`}
            alt={message.user.username}
            className="h-8 w-8 rounded-full"
          />
        </div>
      )}
      
      <div className={`max-w-xs md:max-w-md ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg`}>
        {!isCurrentUser && (
          <div className="font-semibold text-xs mb-1">{message.user.username}</div>
        )}
        <div>{message.text}</div>
        <div className="text-xs mt-1 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {isCurrentUser && (
        <div className="flex-shrink-0 ml-2">
          <img
            src={message.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.user.id}`}
            alt={message.user.username}
            className="h-8 w-8 rounded-full"
          />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;