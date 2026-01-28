import express from "express";
import { protectRoute } from "../middleware/protecRoute.js";
import {
  commentOnPost,
  createPost,
  deleteComment,
  deletePost,
  likePost,
  unlikePost,
} from "../controllers/posts.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createPost);
router.post("/like/:postId", protectRoute, likePost);
router.post("/unlike/:postId", protectRoute, unlikePost);
router.post("/comment/:postId", protectRoute, commentOnPost);
router.delete("/delete/:postId", protectRoute, deletePost);
router.delete(
  "/comment/delete/:postId/:commentId",
  protectRoute,
  deleteComment,
);

export default router;
