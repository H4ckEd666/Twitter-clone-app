import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({
      to: userId,
      $or: [{ type: { $ne: "like" } }, { from: { $ne: userId } }],
    })
      .sort({ createdAt: -1 })
      .populate("from", "username avatar")
      .populate("post", "text img")
      .populate("comment", "text");

    await Notification.updateMany({ to: userId }, { read: true });

    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ to: userId });
    res.status(200).json({ message: "Notifications deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteNotificationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      to: userId,
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const markedAsReaded = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany({ to: userId }, { read: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.read = true;
    await notification.save();
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markNotificationAsUnread = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.read = false;
    await notification.save();
    res.status(200).json({ message: "Notification marked as unread" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({
      to: userId,
      $or: [{ type: { $ne: "like" } }, { from: { $ne: userId } }],
      read: false,
    });
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
