import React, { useState } from "react";
import { useChat } from "../context/ChatContext";
import { User, UserPlus } from "lucide-react";

const UserProfile: React.FC = () => {
  const { connected, joinChat } = useChat();
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    joinChat(username, avatar);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <div className="flex items-center justify-center mb-6">
        <User className="h-12 w-12 text-blue-500" />
        <h1 className="text-2xl font-bold ml-2">Join Chat</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="mb-6">
          <label
            htmlFor="avatar"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Avatar URL (optional)
          </label>
          <input
            type="text"
            id="avatar"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/avatar.jpg"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty for a random avatar
          </p>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Join Chat
        </button>

        <div className="mt-6 p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-sm text-gray-700 font-medium">Demo Mode Active</p>
          <p className="text-xs text-gray-500 mt-2">
            This is a standalone demo of the chat application. Enter a username
            to start chatting!
          </p>
        </div>
      </form>
    </div>
  );
};

export default UserProfile;
