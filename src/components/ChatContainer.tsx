import React, { useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { MessageSquare } from "lucide-react";

const ChatContainer: React.FC = () => {
  const { messages, typingUsers } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <MessageSquare className="h-6 w-6 text-blue-500 mr-2" />
          <h1 className="text-xl font-bold">WebSocket Chat</h1>
          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Demo Mode
          </span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {typingUsers.length > 0 && (
              <div className="text-gray-500 text-sm ml-4 mb-2">
                {typingUsers.length === 1
                  ? `${typingUsers[0].username} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ChatInput />
    </div>
  );
};

export default ChatContainer;
