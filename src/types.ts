export interface User {
  id: string;
  username: string;
  avatar: string;
  socketId?: string;
  joinedAt?: Date;
}

export interface Message {
  id: string;
  text: string;
  timestamp: Date;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  type?: 'user' | 'system';
}

export interface TypingIndicator {
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface ChatState {
  connected: boolean;
  user: User | null;
  users: User[];
  messages: Message[];
  typingUsers: TypingIndicator[];
}