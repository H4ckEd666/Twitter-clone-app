import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getIo, getSocketIdByUserId } from "../socket/index.js";

const areMutuals = async (userId, otherUserId) => {
  const currentUser = await User.findById(userId).select("following");
  const otherUser = await User.findById(otherUserId).select("following");
  if (!currentUser || !otherUser) return false;
  const isFollowing = currentUser.following.some(
    (id) => id.toString() === otherUserId.toString(),
  );
  const isFollowedBack = otherUser.following.some(
    (id) => id.toString() === userId.toString(),
  );
  return isFollowing && isFollowedBack;
};

export const getMessagesWithUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: otherUserId } = req.params;

    const conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      return res.status(200).json({ conversationId: null, messages: [] });
    }

    await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: userId,
        sender: otherUserId,
        read: false,
      },
      { $set: { read: true } },
    );

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .populate("sender", "username fullName profileImage")
      .populate("receiver", "username fullName profileImage");

    res.status(200).json({ conversationId: conversation._id, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const results = await Message.aggregate([
      { $match: { receiver: userId, read: false } },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      counts: results.map((r) => ({ senderId: r._id, count: r.count })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessageToUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: otherUserId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const mutual = await areMutuals(userId, otherUserId);
    if (!mutual) {
      return res
        .status(403)
        .json({ message: "You can only chat with mutuals" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, otherUserId],
      });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: userId,
      receiver: otherUserId,
      text: text.trim(),
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username fullName profileImage")
      .populate("receiver", "username fullName profileImage");

    const io = getIo();
    const receiverSocketId = getSocketIdByUserId(otherUserId);
    if (io && receiverSocketId) {
      io.to(receiverSocketId).emit("message:new", populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
