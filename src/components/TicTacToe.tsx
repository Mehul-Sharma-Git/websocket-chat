import React from "react";
import { useChat } from "../context/ChatContext";
import { useApp } from "../context/AppContext";
import { ArrowLeft, RefreshCw } from "lucide-react";

const TicTacToe: React.FC = () => {
  const { user, makeMove } = useChat();
  const { ticTacToe, resetTicTacToe, setActiveFeature } = useApp();

  const {
    board,
    currentPlayer,
    winner,
    isDraw,
    playerX,
    playerO,
    status,
    gameId,
  } = ticTacToe;

  const isMyTurn = () => {
    if (!user || status !== "playing") return false;

    if (playerX?.id === user.id && currentPlayer === "X") return true;
    if (playerO?.id === user.id && currentPlayer === "O") return true;

    return false;
  };

  const handleCellClick = (index: number) => {
    if (!gameId || board[index] || !isMyTurn() || winner || isDraw) return;

    makeMove(index);
  };

  const renderCell = (index: number) => {
    const value = board[index];
    const isClickable = !value && isMyTurn() && !winner && !isDraw;

    return (
      <div
        key={index}
        className={`flex items-center justify-center text-4xl font-bold border border-gray-300 h-20 w-20
          ${isClickable ? "cursor-pointer hover:bg-gray-100" : "cursor-default"}
          ${
            value === "X"
              ? "text-blue-500"
              : value === "O"
              ? "text-red-500"
              : ""
          }`}
        onClick={() => handleCellClick(index)}
      >
        {value}
      </div>
    );
  };

  const renderStatus = () => {
    if (winner) {
      const winnerUser = winner === "X" ? playerX : playerO;
      const isCurrentUser = winnerUser?.id === user?.id;

      return (
        <div
          className={`text-lg font-semibold ${
            isCurrentUser ? "text-green-600" : "text-red-600"
          }`}
        >
          {isCurrentUser ? "You won!" : `${winnerUser?.username} won!`}
        </div>
      );
    }

    if (isDraw) {
      return (
        <div className="text-lg font-semibold text-gray-600">
          Game ended in a draw!
        </div>
      );
    }

    if (status === "waiting") {
      return (
        <div className="text-lg font-semibold text-gray-600">
          Waiting for opponent...
        </div>
      );
    }

    const currentPlayerUser = currentPlayer === "X" ? playerX : playerO;
    const isCurrentUser = currentPlayerUser?.id === user?.id;

    return (
      <div
        className={`text-lg font-semibold ${
          isCurrentUser ? "text-blue-600" : "text-gray-600"
        }`}
      >
        {isCurrentUser ? "Your turn" : `${currentPlayerUser?.username}'s turn`}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <button
            onClick={() => setActiveFeature("home")}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Tic Tac Toe</h1>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="mb-6">{renderStatus()}</div>

        <div className="grid grid-cols-3 gap-1 mb-6">
          {Array(9)
            .fill(null)
            .map((_, index) => renderCell(index))}
        </div>

        <div className="flex items-center space-x-4">
          {(winner || isDraw) && (
            <button
              onClick={resetTicTacToe}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Play Again
            </button>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="font-semibold mb-1">Player X</div>
            <div className="flex flex-col items-center">
              {playerX ? (
                <>
                  <img
                    src={
                      playerX.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerX.id}`
                    }
                    alt={playerX.username}
                    className="h-10 w-10 rounded-full mb-1"
                  />
                  <div className="text-sm">{playerX.username}</div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Waiting...</div>
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="font-semibold mb-1">Player O</div>
            <div className="flex flex-col items-center">
              {playerO ? (
                <>
                  <img
                    src={
                      playerO.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerO.id}`
                    }
                    alt={playerO.username}
                    className="h-10 w-10 rounded-full mb-1"
                  />
                  <div className="text-sm">{playerO.username}</div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Waiting...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;
