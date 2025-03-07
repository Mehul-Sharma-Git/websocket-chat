import React from "react";
import { useChat } from "../context/ChatContext";
import { useApp } from "../context/AppContext";
import { MessageSquare, Grid, Users, GamepadIcon } from "lucide-react";

const Home: React.FC = () => {
  const { users, user, inviteToGame, respondToGameInvite } = useChat();
  const { setActiveFeature, gameInvites } = useApp();

  const pendingInvites = gameInvites.filter(
    (invite) => invite.status === "pending" && invite.to.id === user?.id
  );

  const handleInviteToGame = (userId: string) => {
    inviteToGame(userId, "tictactoe");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <GamepadIcon className="h-6 w-6 text-blue-500 mr-2" />
          <h1 className="text-xl font-bold">WebSocket Hub</h1>
        </div>
      </div>

      <div className="flex-grow p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Welcome, {user?.username}!
          </h2>

          {pendingInvites.length > 0 && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Game Invitations</h3>
              <ul className="space-y-2">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm"
                  >
                    <div className="flex items-center">
                      <img
                        src={
                          invite.from.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${invite.from.id}`
                        }
                        alt={invite.from.username}
                        className="h-8 w-8 rounded-full mr-2"
                      />
                      <span>
                        {invite.from.username} invited you to play{" "}
                        {invite.gameType}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                        onClick={() => respondToGameInvite(invite.id, true)}
                      >
                        Accept
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                        onClick={() => respondToGameInvite(invite.id, false)}
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveFeature("chat")}
            >
              <div className="flex items-center mb-4">
                <MessageSquare className="h-8 w-8 text-blue-500 mr-2" />
                <h3 className="text-xl font-semibold">Chat Room</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Join the conversation with other users in real-time.
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-1" />
                <span>{users.length} users online</span>
              </div>
            </div>

            <div
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveFeature("tictactoe")}
            >
              <div className="flex items-center mb-4">
                <Grid className="h-8 w-8 text-blue-500 mr-2" />
                <h3 className="text-xl font-semibold">Tic Tac Toe</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Challenge other users to a game of Tic Tac Toe.
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <GamepadIcon className="h-4 w-4 mr-1" />
                <span>Classic 3x3 grid game</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">Online Users</h3>
            <div className="bg-white rounded-lg shadow-md p-4">
              <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {users.map((onlineUser) => (
                  <li
                    key={onlineUser.id}
                    className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-md"
                  >
                    <img
                      src={
                        onlineUser.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${onlineUser.id}`
                      }
                      alt={onlineUser.username}
                      className="h-12 w-12 rounded-full mb-2"
                    />
                    <div className="text-center">
                      <div className="font-medium text-sm">
                        {onlineUser.username}
                      </div>
                      {onlineUser.id !== user?.id && (
                        <button
                          className="mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInviteToGame(onlineUser.id);
                          }}
                        >
                          Invite to game
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
