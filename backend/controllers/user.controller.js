import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res) => {
  // Logic to get user profile by username
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password -email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSuggestedUsers = async (req, res) => {
  // Logic to get suggested users
  try {
    const userId = req.user._id;
    const usersFollowedByMe = await User.findById(userId).select("following");
    const users = await User.aggregate([
      { $match: { _id: { $ne: userId, $nin: usersFollowedByMe.following } } },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id),
    );
    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => {
      user.password = null;
    });

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const followUnfollowUser = async (req, res) => {
  // Logic to follow or unfollow a user by username
  const { id } = req.params;

  if (id === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (!userToModify || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.includes(userToModify._id);

    if (isFollowing) {
      await User.findByIdAndUpdate(id, {
        $pull: { followers: currentUser._id },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: userToModify._id },
      });
      res.status(200).json({ message: "Unfollowed successfully" });
    } else {
      await User.findByIdAndUpdate(id, {
        $push: { followers: currentUser._id },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $push: { following: userToModify._id },
      });
      const newNotification = new Notification({
        from: currentUser._id,
        to: userToModify._id,
        type: "follow",
      });
      await newNotification.save();

      res.status(200).json({ message: "Followed successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  // Logic to update user profile
  const {
    fullName,
    email,
    username,
    currentPassword,
    newPassword,
    bio,
    links,
  } = req.body;
  let { profileImage, coverImage } = req.body;
  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate email format if email is being updated
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      // Check if email is already taken by another user
      const existingEmail = await User.findOne({ email });
      if (existingEmail && existingEmail._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: "Email already taken" });
      }
    }

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    // Password update validation
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Both current and new passwords are required" });
      }
      if (currentPassword.trim() === "" || newPassword.trim() === "") {
        return res.status(400).json({ message: "Passwords cannot be empty" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "New password must be at least 6 characters long" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    if (profileImage) {
      if (user.profileImage) {
        await cloudinary.uploader.destroy(
          user.profileImage.split("/").pop().split(".")[0],
        );
      }
      const uploaderResponse = await cloudinary.uploader.upload(profileImage);
      profileImage = uploaderResponse.secure_url;
    }
    if (coverImage) {
      if (user.coverImage) {
        await cloudinary.uploader.destroy(
          user.coverImage.split("/").pop().split(".")[0],
        );
      }
      const uploaderResponse = await cloudinary.uploader.upload(coverImage);
      coverImage = uploaderResponse.secure_url;
    }
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.links = links || user.links;
    user.profileImage = profileImage || user.profileImage;
    user.coverImage = coverImage || user.coverImage;

    user = await user.save();

    user.password = null;
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
