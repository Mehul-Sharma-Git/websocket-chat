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
  type?: "user" | "system";
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

export type GameType = "tictactoe";

export interface GameInvite {
  id: string;
  gameType: GameType;
  from: User;
  to: User;
  timestamp: Date;
  status: "pending" | "accepted" | "rejected" | "expired";
}

export interface TicTacToeState {
  board: Array<string | null>;
  currentPlayer: string;
  winner: string | null;
  isDraw: boolean;
  playerX: User | null;
  playerO: User | null;
  gameId: string | null;
  status: "waiting" | "playing" | "finished";
}

export interface AppState {
  activeFeature: "chat" | "tictactoe" | "home";
  gameInvites: GameInvite[];
  ticTacToe: TicTacToeState;
}
