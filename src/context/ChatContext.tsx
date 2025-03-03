import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { User, Message, TypingIndicator, ChatState } from "../types";

// Determine the WebSocket server URL
const getServerUrl = () => {
  // In development, connect to the WebSocket server through the Vite proxy
  // The proxy will forward requests to the WebSocket server running on port 3000
  return "";
};

// Action types
type ChatAction =
  | { type: "CONNECT"; payload: boolean }
  | { type: "SET_USER"; payload: User }
  | { type: "SET_USERS"; payload: User[] }
  | { type: "ADD_USER"; payload: User }
  | { type: "REMOVE_USER"; payload: string }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_TYPING"; payload: TypingIndicator }
  | { type: "CLEAR_TYPING"; payload: string };

// Initial state
const initialState: ChatState = {
  connected: false,
  user: null,
  users: [],
  messages: [],
  typingUsers: [],
};

// Reducer function
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "CONNECT":
      return { ...state, connected: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_USERS":
      return { ...state, users: action.payload };
    case "ADD_USER":
      return { ...state, users: [...state.users, action.payload] };
    case "REMOVE_USER":
      return {
        ...state,
        users: state.users.filter((user) => user.id !== action.payload),
        typingUsers: state.typingUsers.filter(
          (user) => user.userId !== action.payload
        ),
      };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_TYPING":
      const existingIndex = state.typingUsers.findIndex(
        (user) => user.userId === action.payload.userId
      );

      if (existingIndex >= 0) {
        // Update existing typing indicator
        const updatedTypingUsers = [...state.typingUsers];
        updatedTypingUsers[existingIndex] = action.payload;
        return { ...state, typingUsers: updatedTypingUsers };
      } else if (action.payload.isTyping) {
        // Add new typing indicator
        return {
          ...state,
          typingUsers: [...state.typingUsers, action.payload],
        };
      }
      return state;
    case "CLEAR_TYPING":
      return {
        ...state,
        typingUsers: state.typingUsers.filter(
          (user) => user.userId !== action.payload
        ),
      };
    default:
      return state;
  }
};

// Context
interface ChatContextType extends ChatState {
  socket: Socket | null;
  joinChat: (username: string, avatar?: string) => void;
  sendMessage: (text: string) => void;
  setTyping: (isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType>({
  ...initialState,
  socket: null,
  joinChat: () => {},
  sendMessage: () => {},
  setTyping: () => {},
});

// Provider component
interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [socket, setSocket] = React.useState<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const serverUrl = getServerUrl();
    console.log("Connecting to WebSocket server...");

    // Configure socket with more robust options
    const socketInstance = io(serverUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket server");
      dispatch({ type: "CONNECT", payload: true });
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      dispatch({ type: "CONNECT", payload: false });
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Connection error:", error);
      dispatch({ type: "CONNECT", payload: false });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle initialization data
    socket.on(
      "initialize",
      (data: { user: User; users: User[]; chatHistory: Message[] }) => {
        dispatch({ type: "SET_USER", payload: data.user });
        dispatch({ type: "SET_USERS", payload: data.users });
        dispatch({ type: "SET_MESSAGES", payload: data.chatHistory });
      }
    );

    // Handle new user joining
    socket.on("user-joined", (data: { user: User; message: Message }) => {
      dispatch({ type: "ADD_USER", payload: data.user });
      dispatch({ type: "ADD_MESSAGE", payload: data.message });
    });

    // Handle user leaving
    socket.on("user-left", (data: { userId: string; message: Message }) => {
      dispatch({ type: "REMOVE_USER", payload: data.userId });
      dispatch({ type: "ADD_MESSAGE", payload: data.message });
    });

    // Handle incoming messages
    socket.on("message", (message: Message) => {
      dispatch({ type: "ADD_MESSAGE", payload: message });
    });

    // Handle typing indicators
    socket.on("user-typing", (data: TypingIndicator) => {
      if (data.isTyping) {
        dispatch({ type: "SET_TYPING", payload: data });
      } else {
        dispatch({ type: "CLEAR_TYPING", payload: data.userId });
      }
    });

    return () => {
      socket.off("initialize");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("message");
      socket.off("user-typing");
    };
  }, [socket]);

  // Join chat function
  const joinChat = (username: string, avatar?: string) => {
    if (socket && socket.connected) {
      socket.emit("join", { username, avatar });
    }
  };

  // Send message function
  const sendMessage = (text: string) => {
    if (socket && socket.connected && state.user) {
      socket.emit("message", { text });
    }
  };

  // Set typing indicator
  const setTyping = (isTyping: boolean) => {
    if (socket && socket.connected && state.user) {
      socket.emit("typing", isTyping);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        ...state,
        socket,
        joinChat,
        sendMessage,
        setTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook
export const useChat = () => useContext(ChatContext);
