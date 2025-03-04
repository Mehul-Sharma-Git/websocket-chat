import React from "react";
import { useChat } from "../context/ChatContext";
import { useApp } from "../context/AppContext";
import { GamepadIcon, Check, X } from "lucide-react";

const GameInvites: React.FC = () => {
  const { respondToGameInvite, user } = useChat();
  const { gameInvites } = useApp();

  const pendingInvites = gameInvites.filter(
    (invite) => invite.status === "pending" && invite.to.id === user?.id
  );

  if (pendingInvites.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {pendingInvites.map((invite) => (
        <div
          key={invite.id}
          className="bg-white rounded-lg shadow-lg p-4 mb-2 w-72 border-l-4 border-blue-500 animate-fadeIn"
        >
          <div className="flex items-center mb-2">
            <GamepadIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="font-semibold">Game Invitation</h3>
          </div>

          <div className="flex items-center mb-3">
            <img
              src={
                invite.from.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${invite.from.id}`
              }
              alt={invite.from.username}
              className="h-8 w-8 rounded-full mr-2"
            />
            <div>
              <div className="text-sm font-medium">{invite.from.username}</div>
              <div className="text-xs text-gray-500">
                invites you to play {invite.gameType}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => respondToGameInvite(invite.id, false)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              title="Decline"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={() => respondToGameInvite(invite.id, true)}
              className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700"
              title="Accept"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameInvites;
