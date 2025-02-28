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
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  // Improved Socket.IO configuration
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  allowUpgrades: true,
  cookie: false,
});

// Serve static files from the dist directory
app.use(express.static(join(__dirname, "../dist")));

// Handle all routes by serving index.html (for SPA)
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../dist/index.html"));
});

// Store connected users and chat history
const users = new Map();
const chatHistory = [];
const MAX_HISTORY = 50; // Limit chat history to prevent memory issues

// Get local IP addresses
const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    if (!interfaceInfo) continue;

    for (const info of interfaceInfo) {
      // Skip internal and non-IPv4 addresses
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

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server is ready for connections`);

  // Display all local IP addresses for connecting from other devices
  const localIPs = getLocalIPs();
  if (localIPs.length > 0) {
    console.log("\nConnect from other devices using one of these URLs:");
    localIPs.forEach((ip) => {
      console.log(`http://${ip}:${PORT}`);
    });
  } else {
    console.log(
      "\nNo network interfaces found for connecting from other devices"
    );
  }
});
