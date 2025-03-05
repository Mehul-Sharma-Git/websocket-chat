import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { v4 as uuidv4 } from "uuid";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with CORS settings
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  allowUpgrades: true,
  cookie: false,
  path: "/socket.io/",
});

// Serve static files from the dist directory
app.use(express.static(join(__dirname, "../dist")));

// Add CORS headers for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Handle all routes by serving index.html (for SPA)
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../dist/index.html"));
});

// Store connected users and chat history
const users = new Map();
const chatHistory = [];
const MAX_HISTORY = 50;

// Game state
const gameInvites = new Map();
const ticTacToeGames = new Map();

// Get local IP addresses
const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    if (!interfaceInfo) continue;

    for (const info of interfaceInfo) {
      if (info.family === "IPv4" && !info.internal) {
        addresses.push(info.address);
      }
    }
  }

  return addresses;
};

// Check for tic-tac-toe win
const checkWin = (board) => {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // columns
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
};

// Check for tic-tac-toe draw
const checkDraw = (board) => {
  return board.every((cell) => cell !== null);
};

// Handle socket connections
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle user joining
  socket.on("join", ({ username, avatar }) => {
    const userId = uuidv4();
    const user = {
      id: userId,
      username: username || `User-${userId.substring(0, 6)}`,
      avatar:
        avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      socketId: socket.id,
      joinedAt: new Date(),
    };

    users.set(socket.id, user);

    // Send welcome message
    const welcomeMessage = {
      id: uuidv4(),
      type: "system",
      text: `${user.username} has joined the chat`,
      timestamp: new Date(),
      user: { id: "system", username: "System" },
    };

    chatHistory.push(welcomeMessage);
    if (chatHistory.length > MAX_HISTORY) chatHistory.shift();

    // Send current users and chat history to the new user
    socket.emit("initialize", {
      user,
      users: Array.from(users.values()),
      chatHistory,
    });

    // Notify other users about the new user
    socket.broadcast.emit("user-joined", { user, message: welcomeMessage });
  });

  // Handle chat messages
  socket.on("message", (messageData) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: uuidv4(),
      text: messageData.text,
      timestamp: new Date(),
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
    };

    chatHistory.push(message);
    if (chatHistory.length > MAX_HISTORY) chatHistory.shift();

    // Broadcast message to all clients
    io.emit("message", message);
  });

  // Handle typing indicator
  socket.on("typing", (isTyping) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.broadcast.emit("user-typing", {
      userId: user.id,
      username: user.username,
      isTyping,
    });
  });

  // Handle game invites
  socket.on("invite-to-game", ({ userId, gameType }) => {
    const fromUser = users.get(socket.id);
    if (!fromUser) return;

    // Find the target user
    let toUser = null;
    for (const [_, user] of users.entries()) {
      if (user.id === userId) {
        toUser = user;
        break;
      }
    }

    if (!toUser) return;

    // Create game invite
    const inviteId = uuidv4();
    const invite = {
      id: inviteId,
      gameType,
      from: fromUser,
      to: toUser,
      timestamp: new Date(),
      status: "pending",
    };

    gameInvites.set(inviteId, invite);

    // Send invite to target user
    io.to(toUser.socketId).emit("game-invite", invite);

    // Set timeout to expire invite after 60 seconds
    setTimeout(() => {
      const storedInvite = gameInvites.get(inviteId);
      if (storedInvite && storedInvite.status === "pending") {
        storedInvite.status = "expired";
        gameInvites.set(inviteId, storedInvite);
        io.to(toUser.socketId).emit("game-invite-expired", { inviteId });
      }
    }, 60000);
  });

  // Handle game invite responses
  socket.on("respond-to-game-invite", ({ inviteId, accept }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const invite = gameInvites.get(inviteId);
    if (!invite || invite.status !== "pending" || invite.to.id !== user.id)
      return;

    // Update invite status
    invite.status = accept ? "accepted" : "rejected";
    gameInvites.set(inviteId, invite);

    // Notify the inviter
    io.to(invite.from.socketId).emit("game-invite-response", {
      inviteId,
      accepted: accept,
    });

    // If accepted, create a new game
    if (accept && invite.gameType === "tictactoe") {
      const gameId = uuidv4();
      const game = {
        id: gameId,
        board: Array(9).fill(null),
        currentPlayer: "X",
        winner: null,
        isDraw: false,
        playerX: invite.from,
        playerO: invite.to,
        status: "playing",
      };

      ticTacToeGames.set(gameId, game);

      // Send game state to both players
      io.to(invite.from.socketId).emit("tictactoe-update", {
        ...game,
        gameId,
      });

      io.to(invite.to.socketId).emit("tictactoe-update", {
        ...game,
        gameId,
      });
    }
  });

  // Handle tic-tac-toe moves
  socket.on("tictactoe-move", ({ gameId, index }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const game = ticTacToeGames.get(gameId);
    if (!game || game.status !== "playing") return;

    // Verify it's the player's turn
    const isPlayerX = game.playerX.id === user.id;
    const isPlayerO = game.playerO.id === user.id;
    if (
      (!isPlayerX && !isPlayerO) ||
      (isPlayerX && game.currentPlayer !== "X") ||
      (isPlayerO && game.currentPlayer !== "O")
    ) {
      return;
    }

    // Make the move
    if (game.board[index] === null) {
      game.board[index] = game.currentPlayer;

      // Check for win or draw
      const winner = checkWin(game.board);
      const isDraw = !winner && checkDraw(game.board);

      if (winner || isDraw) {
        game.status = "finished";
        game.winner = winner;
        game.isDraw = isDraw;
      } else {
        game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
      }

      ticTacToeGames.set(gameId, game);

      // Broadcast updated game state
      io.to(game.playerX.socketId).emit("tictactoe-update", game);
      io.to(game.playerO.socketId).emit("tictactoe-update", game);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (!user) return;

    users.delete(socket.id);

    const disconnectMessage = {
      id: uuidv4(),
      type: "system",
      text: `${user.username} has left the chat`,
      timestamp: new Date(),
      user: { id: "system", username: "System" },
    };

    chatHistory.push(disconnectMessage);
    if (chatHistory.length > MAX_HISTORY) chatHistory.shift();

    // Notify other users
    io.emit("user-left", { userId: user.id, message: disconnectMessage });

    console.log("Client disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);

  // Display all local IP addresses for connecting from other devices
  const localIPs = getLocalIPs();
  if (localIPs.length > 0) {
    console.log("\nConnect from other devices using one of these URLs:");
    localIPs.forEach((ip) => {
      console.log(`http://${ip}:${PORT}`);
    });
  }
});
