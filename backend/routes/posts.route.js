import express from "express";
import { protectRoute } from "../middleware/protecRoute.js";
import {
  commentOnPost,
  createPost,
  deleteComment,
  deletePost,
  getAllPosts,
  getForYouPosts,
  getFollowingActivity,
  getFollowingPosts,
  getLikedPosts,
  getUserPosts,
  likePost,
  sharePost,
  unlikePost,
} from "../controllers/posts.controller.js";

const router = express.Router();

router.get("/getAll", protectRoute, getAllPosts);
router.get("/forYou", protectRoute, getForYouPosts);
router.get("/getFollowingPosts", protectRoute, getFollowingPosts);
router.get("/following-activity", protectRoute, getFollowingActivity);
router.post("/create", protectRoute, createPost);
router.get("/getUserPosts/:username", protectRoute, getUserPosts);
router.get("/likedposts", protectRoute, getLikedPosts);
router.post("/like/:postId", protectRoute, likePost);
router.post("/unlike/:postId", protectRoute, unlikePost);
router.post("/comment/:postId", protectRoute, commentOnPost);
router.post("/share/:postId", protectRoute, sharePost);
router.delete("/delete/:postId", protectRoute, deletePost);
router.delete(
  "/comment/delete/:postId/:commentId",
  protectRoute,
  deleteComment,
);

export default router;
