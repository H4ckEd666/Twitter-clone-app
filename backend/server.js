import express from "express";
import http from "http";
import dotenv from "dotenv";
import connectMongoDB from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { initSocket } from "./socket/index.js";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/posts.route.js";
import notificationRoutes from "./routes/notification.route.js";
import chatRoutes from "./routes/chat.route.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 8000;
const httpServer = http.createServer(app);
const __dirname = path.resolve();

const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000"];

const csrfOriginCheck = (req, res, next) => {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const origin = req.get("origin");
  const referer = req.get("referer");
  const isAllowed = (value) =>
    value && allowedOrigins.some((allowed) => value.startsWith(allowed));

  if (origin && !isAllowed(origin)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!origin && referer && !isAllowed(referer)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return next();
};

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfOriginCheck);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes); // Example for notification routes
app.use("/api/chat", chatRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
  });
}

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectMongoDB();
});
