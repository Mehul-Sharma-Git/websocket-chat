import React from 'react';
import { useChat } from '../context/ChatContext';
import { Users } from 'lucide-react';

const UsersList: React.FC = () => {
  const { users, typingUsers } = useChat();

  return (
    <div className="bg-gray-50 border-l border-gray-200 w-full md:w-64 p-4 hidden md:block">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-blue-500 mr-2" />
        <h2 className="text-lg font-semibold">Online Users ({users.length})</h2>
      </div>
      
      <ul className="space-y-2">
        {users.map(user => {
          const isTyping = typingUsers.some(
            typingUser => typingUser.userId === user.id && typingUser.isTyping
          );
          
          return (
            <li key={user.id} className="flex items-center p-2 hover:bg-gray-100 rounded-md">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt={user.username}
                className="h-8 w-8 rounded-full mr-2"
              />
              <div>
                <div className="font-medium">{user.username}</div>
                {isTyping && (
                  <div className="text-xs text-gray-500">typing...</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default UsersList;