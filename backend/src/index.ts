import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from "bcryptjs";
import { rateLimit } from 'express-rate-limit';

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import notificationRoutes from "./routes/notification.route.js";
import friendshipRoutes from "./routes/friendship.route.js";
import workspaceRoutes from "./routes/workspace.route.js";
import { app, server } from "./lib/socket.js";
import { deleteExpiredMessages } from "./controllers/message.controller.js";
import { deleteOldNotifications } from "./controllers/notification.controller.js";
import User from "./models/user.model.js";
import AppError from "./utils/AppError.js";
import globalErrorHandler from "./middleware/error.middleware.js";
import requestLogger from "./middleware/logger.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 5000;

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20, // Limit each IP to 20 requests per hour for auth
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after an hour' }
});

app.use(requestLogger);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5001",
      "https://Blink.koyeb.app",
      "https://Blink-app.pages.dev"
    ],
    credentials: true,
  })
);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/messages", generalLimiter, messageRoutes);
app.use("/api/notifications", generalLimiter, notificationRoutes);
app.use("/api/friends", generalLimiter, friendshipRoutes);
app.use("/api/workspaces", generalLimiter, workspaceRoutes);

app.all("/api/*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../public")));
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
  });
}

app.use(globalErrorHandler);

async function seedHelpCenter() {
  try {
    const email = process.env.HELP_CENTER_EMAIL || "pansiluco@gmail.com";
    const helpCenterPassword = process.env.HELP_CENTER_PASSWORD || "Pansilu2012@";
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(helpCenterPassword, salt);
      const helpCenter = new User({
        email,
        fullName: "Help Center",
        password: hashedPassword,
        profilePic: "",
      });
      await helpCenter.save();
      console.log("Help Center user seeded successfully.");
    } else if (existingUser.fullName !== "Help Center") {
      existingUser.fullName = "Help Center";
      await existingUser.save();
      console.log("Help Center user name corrected to 'Help Center'.");
    }
  } catch (error: any) {
    console.error("Error seeding Help Center user:", error.message);
  }
}

server.listen(PORT, async () => {
  console.log("server is running on PORT:" + PORT);
  await connectDB();
  await seedHelpCenter();
  await deleteExpiredMessages();
  await deleteOldNotifications();
  setInterval(deleteExpiredMessages, 20 * 60 * 1000);
  setInterval(deleteOldNotifications, 60 * 60 * 1000);
});
