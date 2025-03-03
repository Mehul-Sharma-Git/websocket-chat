import { spawn } from "child_process";
import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import os from "os";

// Create Express app and HTTP server
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
  transports: ["polling", "websocket"],
  allowUpgrades: true,
  cookie: false,
  path: "/socket.io/",
});

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

// Store connected users and chat history
const users = new Map();
const chatHistory = [];
const MAX_HISTORY = 50;

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

// Start the WebSocket server
const WS_PORT = 3000;
httpServer.listen(WS_PORT, "0.0.0.0", () => {
  console.log(`WebSocket server running on http://localhost:${WS_PORT}`);

  // Display all local IP addresses for connecting from other devices
  const localIPs = getLocalIPs();
  if (localIPs.length > 0) {
    console.log("\nConnect from other devices using one of these URLs:");
    localIPs.forEach((ip) => {
      console.log(`http://${ip}:${WS_PORT}`);
    });
  }

  // Start the Vite dev server
  console.log("\nStarting Vite development server...");
  const viteProcess = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
  });

  viteProcess.on("error", (error) => {
    console.error("Failed to start Vite server:", error);
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("Shutting down servers...");
    viteProcess.kill();
    process.exit(0);
  });
});
