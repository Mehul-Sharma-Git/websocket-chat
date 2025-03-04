import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { AppState, GameInvite, User, GameType } from "../types";

// Initial state
const initialState: AppState = {
  activeFeature: "home",
  gameInvites: [],
  ticTacToe: {
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    isDraw: false,
    playerX: null,
    playerO: null,
    gameId: null,
    status: "waiting",
  },
};

// Action types
type AppAction =
  | { type: "SET_ACTIVE_FEATURE"; payload: "chat" | "tictactoe" | "home" }
  | { type: "ADD_GAME_INVITE"; payload: GameInvite }
  | {
      type: "UPDATE_GAME_INVITE";
      payload: { id: string; status: "accepted" | "rejected" | "expired" };
    }
  | { type: "SET_TICTACTOE_BOARD"; payload: Array<string | null> }
  | { type: "SET_TICTACTOE_CURRENT_PLAYER"; payload: string }
  | { type: "SET_TICTACTOE_WINNER"; payload: string | null }
  | { type: "SET_TICTACTOE_DRAW"; payload: boolean }
  | {
      type: "SET_TICTACTOE_PLAYERS";
      payload: { playerX: User | null; playerO: User | null };
    }
  | { type: "SET_TICTACTOE_GAME_ID"; payload: string | null }
  | {
      type: "SET_TICTACTOE_STATUS";
      payload: "waiting" | "playing" | "finished";
    }
  | { type: "RESET_TICTACTOE" };

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_ACTIVE_FEATURE":
      return { ...state, activeFeature: action.payload };
    case "ADD_GAME_INVITE":
      return { ...state, gameInvites: [...state.gameInvites, action.payload] };
    case "UPDATE_GAME_INVITE":
      return {
        ...state,
        gameInvites: state.gameInvites.map((invite) =>
          invite.id === action.payload.id
            ? { ...invite, status: action.payload.status }
            : invite
        ),
      };
    case "SET_TICTACTOE_BOARD":
      return {
        ...state,
        ticTacToe: { ...state.ticTacToe, board: action.payload },
      };
    case "SET_TICTACTOE_CURRENT_PLAYER":
      return {
        ...state,
        ticTacToe: { ...state.ticTacToe, currentPlayer: action.payload },
      };
    case "SET_TICTACTOE_WINNER":
      return {
        ...state,
        ticTacToe: { ...state.ticTacToe, winner: action.payload },
      };
    case "SET_TICTACTOE_DRAW":
      return {
        ...state,
        ticTacToe: { ...state.ticTacToe, isDraw: action.payload },
      };
    case "SET_TICTACTOE_PLAYERS":
      return {
        ...state,
        ticTacToe: {
          ...state.ticTacToe,
          playerX: action.payload.playerX,
          playerO: action.payload.playerO,
        },
      };
    case "SET_TICTACTOE_GAME_ID":
      return {
        ...state,
        ticTacToe: { ...state.ticTacToe, gameId: action.payload },
      };
    case "SET_TICTACTOE_STATUS":
      return {
        ...state,
        ticTacToe: { ...state.ticTacToe, status: action.payload },
      };
    case "RESET_TICTACTOE":
      return {
        ...state,
        ticTacToe: {
          board: Array(9).fill(null),
          currentPlayer: "X",
          winner: null,
          isDraw: false,
          playerX: null,
          playerO: null,
          gameId: null,
          status: "waiting",
        },
      };
    default:
      return state;
  }
};

// Context
interface AppContextType extends AppState {
  setActiveFeature: (feature: "chat" | "tictactoe" | "home") => void;
  addGameInvite: (invite: GameInvite) => void;
  updateGameInvite: (
    id: string,
    status: "accepted" | "rejected" | "expired"
  ) => void;
  setTicTacToeBoard: (board: Array<string | null>) => void;
  setTicTacToeCurrentPlayer: (player: string) => void;
  setTicTacToeWinner: (winner: string | null) => void;
  setTicTacToeDraw: (isDraw: boolean) => void;
  setTicTacToePlayers: (playerX: User | null, playerO: User | null) => void;
  setTicTacToeGameId: (gameId: string | null) => void;
  setTicTacToeStatus: (status: "waiting" | "playing" | "finished") => void;
  resetTicTacToe: () => void;
}

const AppContext = createContext<AppContextType>({
  ...initialState,
  setActiveFeature: () => {},
  addGameInvite: () => {},
  updateGameInvite: () => {},
  setTicTacToeBoard: () => {},
  setTicTacToeCurrentPlayer: () => {},
  setTicTacToeWinner: () => {},
  setTicTacToeDraw: () => {},
  setTicTacToePlayers: () => {},
  setTicTacToeGameId: () => {},
  setTicTacToeStatus: () => {},
  resetTicTacToe: () => {},
});

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setActiveFeature = (feature: "chat" | "tictactoe" | "home") => {
    dispatch({ type: "SET_ACTIVE_FEATURE", payload: feature });
  };

  const addGameInvite = (invite: GameInvite) => {
    dispatch({ type: "ADD_GAME_INVITE", payload: invite });
  };

  const updateGameInvite = (
    id: string,
    status: "accepted" | "rejected" | "expired"
  ) => {
    dispatch({ type: "UPDATE_GAME_INVITE", payload: { id, status } });
  };

  const setTicTacToeBoard = (board: Array<string | null>) => {
    dispatch({ type: "SET_TICTACTOE_BOARD", payload: board });
  };

  const setTicTacToeCurrentPlayer = (player: string) => {
    dispatch({ type: "SET_TICTACTOE_CURRENT_PLAYER", payload: player });
  };

  const setTicTacToeWinner = (winner: string | null) => {
    dispatch({ type: "SET_TICTACTOE_WINNER", payload: winner });
  };

  const setTicTacToeDraw = (isDraw: boolean) => {
    dispatch({ type: "SET_TICTACTOE_DRAW", payload: isDraw });
  };

  const setTicTacToePlayers = (playerX: User | null, playerO: User | null) => {
    dispatch({ type: "SET_TICTACTOE_PLAYERS", payload: { playerX, playerO } });
  };

  const setTicTacToeGameId = (gameId: string | null) => {
    dispatch({ type: "SET_TICTACTOE_GAME_ID", payload: gameId });
  };

  const setTicTacToeStatus = (status: "waiting" | "playing" | "finished") => {
    dispatch({ type: "SET_TICTACTOE_STATUS", payload: status });
  };

  const resetTicTacToe = () => {
    dispatch({ type: "RESET_TICTACTOE" });
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        setActiveFeature,
        addGameInvite,
        updateGameInvite,
        setTicTacToeBoard,
        setTicTacToeCurrentPlayer,
        setTicTacToeWinner,
        setTicTacToeDraw,
        setTicTacToePlayers,
        setTicTacToeGameId,
        setTicTacToeStatus,
        resetTicTacToe,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook
export const useApp = () => useContext(AppContext);
