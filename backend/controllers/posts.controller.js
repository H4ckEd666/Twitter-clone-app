import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";
import { validateBase64Image } from "../lib/utils/validateImage.js";

const parsePagination = (req, defaultLimit = 20, maxLimit = 50) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1),
    maxLimit,
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!img && !text) {
      return res
        .status(400)
        .json({ message: "Post must contain text or an image" });
    }

    if (img) {
      const { valid, error: imgError } = validateBase64Image(img);
      if (!valid) {
        return res.status(400).json({ message: imgError });
      }
      const uploadResponse = await cloudinary.uploader.upload(img);
      img = uploadResponse.secure_url;
    }
    const newPost = new Post({
      user: userId,
      text,
      img,
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const { limit, skip } = parsePagination(req, 20, 50);
    const posts = await Post.find()
      .populate({ path: "user", select: "username avatar" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "comments.user", select: "username avatar" })
      .populate("likes", "user");
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getForYouPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit, skip } = parsePagination(req, 20, 50);
    const posts = await Post.find({
      $or: [
        { user: userId },
        { likes: userId },
        { shares: userId },
        { "comments.user": userId },
      ],
    })
      .populate({ path: "user", select: "username avatar" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "comments.user", select: "username avatar" })
      .populate("likes", "user");
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const { limit, skip } = parsePagination(req, 20, 50);
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const posts = await Post.find({ user: user._id })
      .populate({ path: "user", select: "username avatar" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "comments.user", select: "username avatar" })
      .populate("likes", "user");
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const likePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.shares?.includes(userId)) {
      return res.status(400).json({ message: "Post already shared" });
    }
    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "Post already liked" });
    }

    await User.updateOne(
      { _id: userId },
      { $addToSet: { likedPosts: postId } },
    );
    const notification = new Notification({
      type: "like",
      from: userId,
      to: post.user,
      post: postId,
    });
    await notification.save();

    post.likes.push(userId);
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!post.likes.includes(userId)) {
      return res.status(400).json({ message: "Post not liked yet" });
    }
    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    await post.save();
    await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit, skip } = parsePagination(req, 20, 50);
    const user = await User.findById(userId).populate({
      path: "likedPosts",
      populate: {
        path: "user",
        select: "username avatar",
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.likedPosts.slice(skip, skip + limit));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    const newComment = {
      text,
      user: userId,
    };
    post.comments.push(newComment);

    const notification = new Notification({
      type: "comment",
      from: userId,
      to: post.user,
      post: postId,
      comment: newComment._id,
      commentText: text,
    });
    await notification.save();
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized action" });
    }
    if (post.img) {
      const publicId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    await Post.findByIdAndDelete(req.params.postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized action" });
    }
    const commentIndex = post.comments.findIndex(
      (comment) => comment._id.toString() === commentId,
    );
    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }
    post.comments.splice(commentIndex, 1);
    await post.save();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit, skip } = parsePagination(req, 20, 50);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const posts = await Post.find({ user: { $in: user.following } })
      .populate({ path: "user", select: "username avatar" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "comments.user", select: "username avatar" })
      .populate("likes", "user");
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFollowingActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit, skip } = parsePagination(req, 20, 50);
    const user = await User.findById(userId).select("following");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingIds = user.following || [];
    if (followingIds.length === 0) {
      return res.status(200).json([]);
    }

    const posts = await Post.find({ user: { $in: followingIds } })
      .populate({ path: "user", select: "username avatar fullName" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const activities = await Notification.find({ from: { $in: followingIds } })
      .populate("from", "username avatar fullName")
      .populate("to", "username")
      .populate({
        path: "post",
        populate: { path: "user", select: "username avatar fullName" },
        select: "text img user",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const postItems = posts.map((post) => ({
      type: "post",
      createdAt: post.createdAt,
      from: post.user,
      post,
    }));

    const activityItems = activities.map((activity) => ({
      type: activity.type,
      createdAt: activity.createdAt,
      from: activity.from,
      to: activity.to,
      post: activity.post,
    }));

    const merged = [...postItems, ...activityItems].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    res.status(200).json(merged);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sharePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const { toUserId, message } = req.body;

    if (!toUserId) {
      return res.status(400).json({ message: "Recipient is required" });
    }
    if (toUserId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot share to yourself" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const currentUser = await User.findById(userId).select(
      "following followers",
    );
    const targetUser = await User.findById(toUserId).select("following");
    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMutual =
      currentUser.following.some(
        (id) => id.toString() === toUserId.toString(),
      ) &&
      targetUser.following.some((id) => id.toString() === userId.toString());

    if (!isMutual) {
      return res
        .status(403)
        .json({ message: "You can only share with mutuals" });
    }

    const notification = new Notification({
      type: "share",
      from: userId,
      to: toUserId,
      post: postId,
      message: message?.toString().trim() || "",
    });
    await notification.save();

    post.shares.push(userId);
    await post.save();

    res.status(200).json({ message: "Post shared" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
