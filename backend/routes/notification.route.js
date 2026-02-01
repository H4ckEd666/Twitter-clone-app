import express from "express";
import { protectRoute } from "../middleware/protecRoute.js";
import {
  deleteNotificationById,
  deleteNotifications,
  getNotifications,
  getUnreadNotificationsCount,
  markedAsReaded,
  markNotificationAsRead,
  markNotificationAsUnread,
} from "../controllers/notifications.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.get("/unread-count", protectRoute, getUnreadNotificationsCount);
router.delete("/", protectRoute, deleteNotifications);
router.delete("/delete/:id", protectRoute, deleteNotificationById);
router.post("/readed", protectRoute, markedAsReaded);
router.post("/read/:id", protectRoute, markNotificationAsRead);
router.post("/unread/:id", protectRoute, markNotificationAsUnread);

export default router;
