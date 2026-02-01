import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "share"],
      required: true,
    },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    commentText: { type: String, default: "" },
    message: { type: String, default: "" },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
