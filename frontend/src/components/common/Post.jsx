import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

import LoadingSpinner from "./LoadingSpinner";
import OnlineDot from "./OnlineDot";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
  const [comment, setComment] = useState("");
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState(false);
  const [shareComment, setShareComment] = useState("");
  const [showShareEmojiPicker, setShowShareEmojiPicker] = useState(false);
  const commentEmojiRef = useRef(null);
  const commentEmojiButtonRef = useRef(null);
  const shareEmojiRef = useRef(null);
  const shareEmojiButtonRef = useRef(null);
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const postOwner = post.user;
  const isLiked = authUser
    ? post.likes.some((like) => {
        if (typeof like === "string") return like === authUser._id;
        if (like?._id) return like._id.toString() === authUser._id.toString();
        return like?.toString?.() === authUser._id.toString();
      })
    : false;
  const isSaved = authUser?.savedPosts?.includes(post._id);

  const isMyPost = authUser?._id === post.user._id;

  const formattedDate = formatPostDate(post.createdAt);

  const {
    data: mutualUsers = [],
    isLoading: isMutualsLoading,
    refetch: refetchMutuals,
  } = useQuery({
    queryKey: ["mutualUsers"],
    queryFn: async () => {
      const res = await fetch("/api/users/mutuals");
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data.error || "Failed to load mutuals");
      }
      return data;
    },
    enabled: false,
  });

  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/delete/${post._id}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const { mutate: toggleLike, isPending: isLiking } = useMutation({
    mutationFn: async ({ shouldLike }) => {
      try {
        const endpoint = shouldLike
          ? `/api/posts/like/${post._id}`
          : `/api/posts/unlike/${post._id}`;
        const res = await fetch(endpoint, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: (updatedPost) => {
      // this is not the best UX, bc it will refetch all posts
      // queryClient.invalidateQueries({ queryKey: ["posts"] });

      // instead, update the cache directly for that post
      queryClient.setQueriesData({ queryKey: ["posts"] }, (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((p) => {
          if (p._id === post._id) {
            return { ...p, likes: updatedPost.likes };
          }
          return p;
        });
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/comment/${post._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: comment }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("Comment posted successfully");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: toggleSave, isPending: isSaving } = useMutation({
    mutationFn: async ({ shouldSave }) => {
      const endpoint = shouldSave
        ? `/api/users/save/${post._id}`
        : `/api/users/unsave/${post._id}`;
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Action failed");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["authUser"], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, savedPosts: data.savedPosts };
      });
      toast.success(data.message || "Updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: sharePost, isPending: isSharing } = useMutation({
    mutationFn: async ({ toUserId, message }) => {
      const res = await fetch(`/api/posts/share/${post._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Share failed");
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Post shared");
      setShareComment("");
      setShowShareEmojiPicker(false);
      document.getElementById(`share_modal${post._id}`)?.close();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeletePost = () => {
    deletePost();
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (isCommenting) return;
    commentPost();
  };

  const handleCommentEmojiClick = (emojiData) => {
    const emoji =
      emojiData?.emoji || emojiData?.native || emojiData?.symbol || "";
    if (!emoji) return;
    setComment((prev) => `${prev}${emoji}`);
    setShowCommentEmojiPicker(false);
  };

  const handleShareEmojiClick = (emojiData) => {
    const emoji =
      emojiData?.emoji || emojiData?.native || emojiData?.symbol || "";
    if (!emoji) return;
    setShareComment((prev) => `${prev}${emoji}`);
    setShowShareEmojiPicker(false);
  };

  useEffect(() => {
    if (!showCommentEmojiPicker) return;

    const handleClickOutside = (event) => {
      const pickerEl = commentEmojiRef.current;
      const buttonEl = commentEmojiButtonRef.current;
      if (!pickerEl || !buttonEl) return;
      if (pickerEl.contains(event.target) || buttonEl.contains(event.target)) {
        return;
      }
      setShowCommentEmojiPicker(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCommentEmojiPicker]);

  useEffect(() => {
    if (!showShareEmojiPicker) return;

    const handleClickOutside = (event) => {
      const pickerEl = shareEmojiRef.current;
      const buttonEl = shareEmojiButtonRef.current;
      if (!pickerEl || !buttonEl) return;
      if (pickerEl.contains(event.target) || buttonEl.contains(event.target)) {
        return;
      }
      setShowShareEmojiPicker(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showShareEmojiPicker]);

  const handleLikePost = () => {
    if (!authUser || isLiking) return;
    toggleLike({ shouldLike: !isLiked });
  };

  const handleSavePost = () => {
    if (!authUser || isSaving) return;
    toggleSave({ shouldSave: !isSaved });
  };

  const handleOpenShare = () => {
    if (!authUser) return;
    refetchMutuals();
    document.getElementById(`share_modal${post._id}`).showModal();
  };

  return (
    <>
      <div className="flex gap-2 items-start p-4 border-b border-gray-700">
        <div className="avatar relative">
          <Link
            to={`/profile/${postOwner.username}`}
            className="w-8 rounded-full overflow-hidden"
          >
            <img src={postOwner.profileImg || "/avatar-placeholder.png"} />
          </Link>
          <OnlineDot userId={postOwner?._id} />
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex gap-2 items-center">
            <Link to={`/profile/${postOwner.username}`} className="font-bold">
              {postOwner.fullName}
            </Link>
            <span className="text-gray-700 flex gap-1 text-sm">
              <Link to={`/profile/${postOwner.username}`}>
                @{postOwner.username}
              </Link>
              <span>·</span>
              <span>{formattedDate}</span>
            </span>
            {isMyPost && (
              <span className="flex justify-end flex-1">
                {!isDeleting && (
                  <FaTrash
                    className="cursor-pointer hover:text-red-500"
                    onClick={handleDeletePost}
                  />
                )}

                {isDeleting && <LoadingSpinner size="sm" />}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3 overflow-hidden">
            <span>{post.text}</span>
            {post.img && (
              <img
                src={post.img}
                className="h-80 object-contain rounded-lg border border-gray-700"
                alt=""
              />
            )}
          </div>
          <div className="flex justify-between mt-3">
            <div className="flex gap-4 items-center w-2/3 justify-between">
              <div
                className="flex gap-1 items-center cursor-pointer group"
                onClick={() =>
                  document
                    .getElementById("comments_modal" + post._id)
                    .showModal()
                }
              >
                <FaRegComment className="w-4 h-4  text-slate-500 group-hover:text-sky-400" />
                <span className="text-sm text-slate-500 group-hover:text-sky-400">
                  {post.comments.length}
                </span>
              </div>
              {/* We're using Modal Component from DaisyUI */}
              <dialog
                id={`comments_modal${post._id}`}
                className="modal border-none outline-none"
              >
                <div className="modal-box rounded border border-gray-600 max-h-[85vh] overflow-visible">
                  <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
                  <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                    {post.comments.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No comments yet 🤔 Be the first one 😉
                      </p>
                    )}
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="flex gap-2 items-start">
                        <div className="avatar relative">
                          <div className="w-8 rounded-full overflow-hidden">
                            <img
                              src={
                                comment.user.profileImg ||
                                "/avatar-placeholder.png"
                              }
                            />
                          </div>
                          <OnlineDot userId={comment.user?._id} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">
                              {comment.user.fullName}
                            </span>
                            <span className="text-gray-700 text-sm">
                              @{comment.user.username}
                            </span>
                          </div>
                          <div className="text-sm">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <form
                      className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                      onSubmit={handlePostComment}
                    >
                      <textarea
                        className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800"
                        placeholder="Add a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          setShowCommentEmojiPicker((prev) => !prev)
                        }
                        ref={commentEmojiButtonRef}
                      >
                        😊
                      </button>
                      <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                        {isCommenting ? <LoadingSpinner size="md" /> : "Post"}
                      </button>
                    </form>
                    {showCommentEmojiPicker && (
                      <div
                        className="absolute right-0 top-full mt-2 z-10"
                        ref={commentEmojiRef}
                      >
                        <EmojiPicker onEmojiClick={handleCommentEmojiClick} />
                      </div>
                    )}
                  </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                  <button className="outline-none">close</button>
                </form>
              </dialog>
              <div className="flex gap-1 items-center group cursor-pointer">
                <BiRepost
                  className="w-6 h-6  text-slate-500 group-hover:text-green-500"
                  onClick={handleOpenShare}
                />
                <span className="text-sm text-slate-500 group-hover:text-green-500">
                  {post.shares?.length || 0}
                </span>
              </div>
              <div
                className="flex gap-1 items-center group cursor-pointer"
                onClick={handleLikePost}
              >
                {isLiking && <LoadingSpinner size="sm" />}
                {!isLiked && !isLiking && (
                  <FaRegHeart className="w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500" />
                )}
                {isLiked && !isLiking && (
                  <FaRegHeart className="w-4 h-4 cursor-pointer text-pink-500 " />
                )}

                <span
                  className={`text-sm  group-hover:text-pink-500 ${
                    isLiked ? "text-pink-500" : "text-slate-500"
                  }`}
                >
                  {post.likes.length}
                </span>
              </div>
            </div>
            <div className="flex w-1/3 justify-end gap-2 items-center">
              {isSaved ? (
                <FaBookmark
                  className="w-4 h-4 text-blue-500 cursor-pointer"
                  onClick={handleSavePost}
                />
              ) : (
                <FaRegBookmark
                  className="w-4 h-4 text-slate-500 cursor-pointer"
                  onClick={handleSavePost}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <dialog
        id={`share_modal${post._id}`}
        className="modal border-none outline-none"
      >
        <div className="modal-box rounded border border-gray-600 max-h-[85vh] overflow-visible">
          <h3 className="font-bold text-lg mb-4">Share post</h3>
          <div className="relative mb-4">
            <textarea
              className="textarea w-full p-2 rounded text-md resize-none border focus:outline-none border-gray-800"
              placeholder="Add a message (optional)"
              value={shareComment}
              onChange={(e) => setShareComment(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm absolute right-2 bottom-2"
              onClick={() => setShowShareEmojiPicker((prev) => !prev)}
              ref={shareEmojiButtonRef}
            >
              😊
            </button>
            {showShareEmojiPicker && (
              <div
                className="absolute right-0 top-full mt-2 z-10"
                ref={shareEmojiRef}
              >
                <EmojiPicker onEmojiClick={handleShareEmojiClick} />
              </div>
            )}
          </div>
          {isMutualsLoading && (
            <div className="flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          )}
          {!isMutualsLoading && mutualUsers.length === 0 && (
            <p className="text-sm text-slate-500">
              No mutual followers available to share.
            </p>
          )}
          {!isMutualsLoading && mutualUsers.length > 0 && (
            <div className="flex flex-col gap-3 max-h-60 overflow-auto">
              {mutualUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="avatar relative">
                      <div className="w-8 rounded-full overflow-hidden">
                        <img
                          src={user.profileImage || "/avatar-placeholder.png"}
                        />
                      </div>
                      <OnlineDot userId={user?._id} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold truncate w-40">
                        {user.fullName}
                      </span>
                      <span className="text-sm text-slate-500">
                        @{user.username}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm rounded-full text-white"
                    onClick={() =>
                      sharePost({ toUserId: user._id, message: shareComment })
                    }
                    disabled={isSharing}
                  >
                    {isSharing ? "Sharing..." : "Share"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button className="outline-none">close</button>
        </form>
      </dialog>
    </>
  );
};
export default Post;
