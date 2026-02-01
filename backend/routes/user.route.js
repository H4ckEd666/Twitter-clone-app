import express from "express";
import { protectRoute } from "../middleware/protecRoute.js";
import {
  followUnfollowUser,
  getFollowingUsers,
  getMutualUsers,
  getSuggestedUsers,
  getUserProfile,
  getSavedPosts,
  savePost,
  unsavePost,
  updateUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/following", protectRoute, getFollowingUsers);
router.get("/mutuals", protectRoute, getMutualUsers);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post("/update", protectRoute, updateUserProfile);
router.get("/saved", protectRoute, getSavedPosts);
router.post("/save/:postId", protectRoute, savePost);
router.post("/unsave/:postId", protectRoute, unsavePost);

export default router;
