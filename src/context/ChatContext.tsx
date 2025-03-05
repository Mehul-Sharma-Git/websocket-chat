import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import {
  User,
  Message,
  TypingIndicator,
  ChatState,
  GameInvite,
  GameType,
} from "../types";
import { useApp } from "./AppContext";

// Initial state
const initialState: ChatState = {
  connected: false,
  user: null,
  users: [],
  messages: [],
  typingUsers: [],
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
        const updatedTypingUsers = [...state.typingUsers];
        updatedTypingUsers[existingIndex] = action.payload;
        return { ...state, typingUsers: updatedTypingUsers };
      } else if (action.payload.isTyping) {
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
  inviteToGame: (userId: string, gameType: GameType) => void;
  respondToGameInvite: (inviteId: string, accept: boolean) => void;
  makeMove: (index: number) => void;
}

const ChatContext = createContext<ChatContextType>({
  ...initialState,
  socket: null,
  joinChat: () => {},
  sendMessage: () => {},
  setTyping: () => {},
  inviteToGame: () => {},
  respondToGameInvite: () => {},
  makeMove: () => {},
});

// Provider component
interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const {
    addGameInvite,
    updateGameInvite,
    setTicTacToeBoard,
    setTicTacToeCurrentPlayer,
    setTicTacToeWinner,
    setTicTacToeDraw,
    setTicTacToePlayers,
    setTicTacToeGameId,
    setTicTacToeStatus,
    setActiveFeature,
  } = useApp();

  // Initialize socket connection
  useEffect(() => {
    console.log("Connecting to WebSocket server...");

    const socketInstance = io({
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
      withCredentials: false,
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

      // Attempt to reconnect after a delay
      setTimeout(() => {
        socketInstance.connect();
      }, 2000);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on(
      "initialize",
      (data: { user: User; users: User[]; chatHistory: Message[] }) => {
        dispatch({ type: "SET_USER", payload: data.user });
        dispatch({ type: "SET_USERS", payload: data.users });
        dispatch({ type: "SET_MESSAGES", payload: data.chatHistory });
      }
    );

    socket.on("user-joined", (data: { user: User; message: Message }) => {
      dispatch({ type: "ADD_USER", payload: data.user });
      dispatch({ type: "ADD_MESSAGE", payload: data.message });
    });

    socket.on("user-left", (data: { userId: string; message: Message }) => {
      dispatch({ type: "REMOVE_USER", payload: data.userId });
      dispatch({ type: "ADD_MESSAGE", payload: data.message });
    });

    socket.on("message", (message: Message) => {
      dispatch({ type: "ADD_MESSAGE", payload: message });
    });

    socket.on("user-typing", (data: TypingIndicator) => {
      if (data.isTyping) {
        dispatch({ type: "SET_TYPING", payload: data });
      } else {
        dispatch({ type: "CLEAR_TYPING", payload: data.userId });
      }
    });

    socket.on("game-invite", (invite: GameInvite) => {
      addGameInvite(invite);
    });

    socket.on(
      "game-invite-response",
      (data: { inviteId: string; accepted: boolean }) => {
        updateGameInvite(
          data.inviteId,
          data.accepted ? "accepted" : "rejected"
        );

        if (data.accepted) {
          setActiveFeature("tictactoe");
        }
      }
    );

    socket.on(
      "tictactoe-update",
      (data: {
        board: Array<string | null>;
        currentPlayer: string;
        winner: string | null;
        isDraw: boolean;
        playerX: User | null;
        playerO: User | null;
        gameId: string;
        status: "waiting" | "playing" | "finished";
      }) => {
        setTicTacToeBoard(data.board);
        setTicTacToeCurrentPlayer(data.currentPlayer);
        setTicTacToeWinner(data.winner);
        setTicTacToeDraw(data.isDraw);
        setTicTacToePlayers(data.playerX, data.playerO);
        setTicTacToeGameId(data.gameId);
        setTicTacToeStatus(data.status);

        if (data.status === "playing") {
          setActiveFeature("tictactoe");
        }
      }
    );

    return () => {
      socket.off("initialize");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("message");
      socket.off("user-typing");
      socket.off("game-invite");
      socket.off("game-invite-response");
      socket.off("tictactoe-update");
    };
  }, [
    socket,
    addGameInvite,
    updateGameInvite,
    setTicTacToeBoard,
    setTicTacToeCurrentPlayer,
    setTicTacToeWinner,
    setTicTacToeDraw,
    setTicTacToePlayers,
    setTicTacToeGameId,
    setTicTacToeStatus,
    setActiveFeature,
  ]);

  const joinChat = (username: string, avatar?: string) => {
    if (socket && socket.connected) {
      socket.emit("join", { username, avatar });
    }
  };

  const sendMessage = (text: string) => {
    if (socket && socket.connected && state.user) {
      socket.emit("message", { text });
    }
  };

  const setTyping = (isTyping: boolean) => {
    if (socket && socket.connected && state.user) {
      socket.emit("typing", isTyping);
    }
  };

  const inviteToGame = (userId: string, gameType: GameType) => {
    if (socket && socket.connected && state.user) {
      socket.emit("invite-to-game", { userId, gameType });
    }
  };

  const respondToGameInvite = (inviteId: string, accept: boolean) => {
    if (socket && socket.connected && state.user) {
      socket.emit("respond-to-game-invite", { inviteId, accept });
    }
  };

  const makeMove = (index: number) => {
    if (socket && socket.connected && state.user) {
      socket.emit("tictactoe-move", { index });
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
        inviteToGame,
        respondToGameInvite,
        makeMove,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
