import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

import { FaUser, FaTrash } from "react-icons/fa";
import { FaHeart, FaRegComment } from "react-icons/fa6";
import { BiRepost } from "react-icons/bi";
import OnlineDot from "../../components/common/OnlineDot";

const NotificationPage = () => {
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data.error || "Failed to load notifications");
      }
      return data;
    },
  });

  const { mutate: deleteNotifications, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete notifications");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Notifications cleared");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete notifications");
    },
  });

  const { mutate: deleteNotificationById } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/notifications/delete/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete notification");
      }
      return { id, data };
    },
    onSuccess: ({ id }) => {
      queryClient.setQueryData(["notifications"], (oldData) =>
        Array.isArray(oldData) ? oldData.filter((n) => n._id !== id) : oldData,
      );
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete notification");
    },
  });

  const { mutate: toggleRead } = useMutation({
    mutationFn: async ({ id, read }) => {
      const endpoint = read
        ? `/api/notifications/unread/${id}`
        : `/api/notifications/read/${id}`;
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update notification");
      }
      return { id, read: !read };
    },
    onSuccess: ({ id, read }) => {
      queryClient.setQueryData(["notifications"], (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((n) => (n._id === id ? { ...n, read } : n));
      });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update notification");
    },
  });

  const { mutate: markAllRead, isPending: isMarkingAllRead } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/readed", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to mark all as read");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.setQueryData(["notifications"], (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((n) => ({ ...n, read: true }));
      });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to mark all as read");
    },
  });

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [notifications]);

  const unreadCount = sortedNotifications.filter((n) => !n.read).length;
  const [filterType, setFilterType] = useState("all");

  const unreadByType = useMemo(() => {
    return sortedNotifications.reduce(
      (acc, n) => {
        if (!n.read) {
          acc.all += 1;
          acc[n.type] = (acc[n.type] || 0) + 1;
        }
        return acc;
      },
      { all: 0, follow: 0, like: 0, comment: 0, share: 0 },
    );
  }, [sortedNotifications]);

  const filteredNotifications = useMemo(() => {
    if (filterType === "all") return sortedNotifications;
    return sortedNotifications.filter((n) => n.type === filterType);
  }, [sortedNotifications, filterType]);

  return (
    <>
      <div className="flex-[4_4_0] w-full border-r border-gray-700 min-h-screen pb-16 md:pb-0">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <p className="font-bold">Notifications</p>
            {unreadCount > 0 && (
              <span className="badge badge-primary">{unreadCount} unread</span>
            )}
          </div>
          <div className="dropdown ">
            <div tabIndex={0} role="button" className="m-1">
              <FaTrash className="w-4" />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <button
                  onClick={() => markAllRead()}
                  disabled={isMarkingAllRead}
                >
                  {isMarkingAllRead ? "Marking..." : "Mark all as read"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => deleteNotifications()}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete all notifications"}
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-700 text-sm">
          {[
            { key: "all", label: "All" },
            { key: "follow", label: "Follows" },
            { key: "like", label: "Likes" },
            { key: "comment", label: "Comments" },
            { key: "share", label: "Shares" },
          ].map((item) => (
            <button
              key={item.key}
              className={`btn btn-xs rounded-full ${
                filterType === item.key
                  ? "btn-primary text-white"
                  : "btn-ghost text-slate-400"
              }`}
              onClick={() => setFilterType(item.key)}
            >
              {item.label}
              {unreadByType[item.key] > 0 && (
                <span className="ml-2 badge badge-primary badge-xs">
                  {unreadByType[item.key]}
                </span>
              )}
            </button>
          ))}
        </div>
        {isLoading && (
          <div className="flex justify-center h-full items-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {filteredNotifications.length === 0 && (
          <div className="text-center p-4 font-bold">No notifications 🤔</div>
        )}
        {isError && (
          <div className="text-center p-4 text-red-500">
            {error.message || "Failed to load notifications"}
          </div>
        )}
        {filteredNotifications?.map((notification) => (
          <div className="border-b border-gray-700" key={notification._id}>
            <div
              className={`flex gap-4 p-4 items-start justify-between cursor-pointer ${
                notification.read ? "" : "bg-[#16181C]"
              }`}
              onClick={() => {
                if (notification.post) {
                  document
                    .getElementById(`activity_post_modal${notification._id}`)
                    ?.showModal();
                }
              }}
            >
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex gap-2">
                  {notification.type === "follow" && (
                    <FaUser className="w-7 h-7 text-primary" />
                  )}
                  {notification.type === "like" && (
                    <FaHeart className="w-7 h-7 text-red-500" />
                  )}
                  {notification.type === "comment" && (
                    <FaRegComment className="w-7 h-7 text-sky-500" />
                  )}
                  {notification.type === "share" && (
                    <BiRepost className="w-7 h-7 text-green-500" />
                  )}
                  <Link
                    to={`/profile/${notification.from.username}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="avatar relative">
                      <div className="w-8 rounded-full overflow-hidden">
                        <img
                          src={
                            notification.from.profileImg ||
                            "/avatar-placeholder.png"
                          }
                        />
                      </div>
                      <OnlineDot userId={notification.from?._id} />
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className="font-bold">
                        @{notification.from.username}
                      </span>{" "}
                      {notification.type === "follow" && "followed you"}
                      {notification.type === "like" && "liked your post"}
                      {notification.type === "comment" &&
                        "commented on your post"}
                      {notification.type === "share" && "shared your post"}
                      {!notification.read && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </Link>
                </div>
                {notification.type === "share" && notification.post && (
                  <button
                    className="w-full text-left border border-gray-700 rounded p-2 hover:bg-[#1a1a1a]"
                    onClick={() =>
                      document
                        .getElementById(`shared_post_modal${notification._id}`)
                        .showModal()
                    }
                  >
                    {notification.message && (
                      <div className="mb-3 rounded border border-gray-700 bg-[#101216] p-2">
                        <p className="text-xs text-slate-500 mb-1">
                          Message from @{notification.from.username}
                        </p>
                        <p className="text-sm text-slate-300">
                          {notification.message}
                        </p>
                      </div>
                    )}
                    <div className="rounded border border-gray-700 bg-[#0b0d10] p-2">
                      <p className="text-xs text-slate-500 mb-1">Shared post</p>
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {notification.post.text}
                      </p>
                      {notification.post.img && (
                        <img
                          src={notification.post.img}
                          alt="shared post"
                          className="mt-2 max-h-40 w-full object-contain rounded"
                        />
                      )}
                    </div>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="text-xs text-slate-500 hover:text-white"
                  onClick={() =>
                    toggleRead({
                      id: notification._id,
                      read: notification.read,
                    })
                  }
                >
                  {notification.read ? "Mark unread" : "Mark read"}
                </button>
                <button
                  className="text-slate-500 hover:text-red-500"
                  onClick={() => deleteNotificationById(notification._id)}
                  aria-label="Delete notification"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
            {notification.post && (
              <dialog
                id={`activity_post_modal${notification._id}`}
                className="modal border-none outline-none"
              >
                <div className="modal-box rounded border border-gray-600 max-h-[85vh] overflow-visible">
                  <h3 className="font-bold text-lg mb-2">Activity</h3>
                  <p className="text-sm text-slate-500 mb-2">
                    From @{notification.from.username}
                  </p>
                  {notification.type === "share" && notification.message && (
                    <div className="mb-4 rounded border border-gray-700 bg-[#101216] p-3">
                      <p className="text-xs text-slate-500 mb-1">
                        Message from @{notification.from.username}
                      </p>
                      <p className="text-sm text-slate-300">
                        {notification.message}
                      </p>
                    </div>
                  )}
                  {notification.type === "comment" &&
                    notification.commentText && (
                      <div className="mb-4 rounded border border-gray-700 bg-[#101216] p-3">
                        <p className="text-xs text-slate-500 mb-1">Comment</p>
                        <p className="text-sm text-slate-300">
                          {notification.commentText}
                        </p>
                      </div>
                    )}
                  <div className="rounded border border-gray-700 bg-[#0b0d10] p-3">
                    <p className="text-xs text-slate-500 mb-1">Post</p>
                    <p className="text-sm text-slate-300">
                      {notification.post.text}
                    </p>
                    {notification.post.img && (
                      <img
                        src={notification.post.img}
                        alt="post"
                        className="mt-3 max-h-80 w-full object-contain rounded"
                      />
                    )}
                  </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                  <button className="outline-none">close</button>
                </form>
              </dialog>
            )}
          </div>
        ))}
      </div>
    </>
  );
};
export default NotificationPage;
