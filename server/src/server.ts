import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { redis } from "./lib/redis";
import { errorMiddleware } from "./middleware/error.middleware";
import { authMiddleware } from "./middleware/auth.middleware";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import messageRoutes from "./routes/message.routes";
import settingsRoutes from "./routes/settings.routes";
import groupRoutes from "./routes/group.routes";
import profileRoutes from "./routes/profile.routes";
import { prisma } from "./lib/prisma";
import { setupSocketHandlers } from "./socket/socket.handler";
import { setIO } from "./lib/io";

dotenv.config();

// Redis instance moved to ./lib/redis.ts

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  // cors: {
  //   origin: process.env.CLIENT_URL || 'http://localhost:5173',
  //   methods: ['GET', 'POST'],
  // },
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/messages", authMiddleware, messageRoutes);
app.use("/api/settings", authMiddleware, settingsRoutes);
app.use("/api/groups", authMiddleware, groupRoutes);
app.use("/api/profile", authMiddleware, profileRoutes);

// Health Check
app.get("/health", async (req, res) => {
  let dbStatus = "disconnected";
  let redisStatus = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (e) {
    dbStatus = "error";
  }
  try {
    const ping = await redis.ping();
    if (ping === "PONG") redisStatus = "connected";
  } catch (e) {
    redisStatus = "error";
  }

  res.json({
    status: "ok",
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
});

setIO(io);

// Socket.io Implementation
setupSocketHandlers(io);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await prisma.$connect();
    console.log("🚀 Database connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
  }
  // Redis ping handled in lib/redis.ts or kept here for health check
});
