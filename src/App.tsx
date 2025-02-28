import React from 'react';
import { useChat } from './context/ChatContext';
import UserProfile from './components/UserProfile';
import ChatContainer from './components/ChatContainer';
import UsersList from './components/UsersList';
import { MessageSquare } from 'lucide-react';

function App() {
  const { connected, user } = useChat();

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <MessageSquare className="h-16 w-16 text-blue-500 mb-4" />
        <h1 className="text-2xl font-bold mb-6">WebSocket Chat</h1>
        <div className="animate-pulse text-gray-600 mb-6">
          Connecting to server...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <UserProfile />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto h-screen p-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col md:flex-row">
          <div className="flex-grow flex flex-col">
            <ChatContainer />
          </div>
          <UsersList />
        </div>
      </div>
    </div>
  );
}

export default App;