import express from "express";
import { protectRoute } from "../middleware/protecRoute.js";
import {
  getMessagesWithUser,
  getUnreadCounts,
  sendMessageToUser,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/messages/:userId", protectRoute, getMessagesWithUser);
router.post("/messages/:userId", protectRoute, sendMessageToUser);
router.get("/unread", protectRoute, getUnreadCounts);

export default router;
