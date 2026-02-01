import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const ChatPage = () => {
  const queryClient = useQueryClient();
  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch authenticated user");
      }
      return data;
    },
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState("");

  const { data: mutuals = [], isLoading: isMutualsLoading } = useQuery({
    queryKey: ["mutualUsers"],
    queryFn: async () => {
      const res = await fetch("/api/users/mutuals");
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || "Failed to load mutuals");
      return data;
    },
    enabled: Boolean(authUser),
  });

  const { data: unreadData } = useQuery({
    queryKey: ["chatUnreadCounts"],
    queryFn: async () => {
      const res = await fetch("/api/chat/unread");
      const data = await res.json().catch(() => ({ counts: [] }));
      if (!res.ok) throw new Error(data.message || "Failed to load unread");
      return data;
    },
    enabled: Boolean(authUser),
    refetchInterval: 15000,
  });

  const unreadMap = useMemo(() => {
    const map = new Map();
    (unreadData?.counts || []).forEach((item) => {
      map.set(item.senderId.toString(), item.count);
    });
    return map;
  }, [unreadData]);

  const messagesQueryKey = useMemo(
    () => ["messages", selectedUser?._id],
    [selectedUser],
  );

  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: messagesQueryKey,
    queryFn: async () => {
      if (!selectedUser) return { messages: [] };
      const res = await fetch(`/api/chat/messages/${selectedUser._id}`);
      const data = await res.json().catch(() => ({ messages: [] }));
      if (!res.ok) throw new Error(data.error || "Failed to load messages");
      return data;
    },
    enabled: Boolean(selectedUser),
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return null;
      const res = await fetch(`/api/chat/messages/${selectedUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to send message");
      return data;
    },
    onSuccess: (message) => {
      if (!message) return;
      setMessageText("");
      queryClient.setQueryData(messagesQueryKey, (oldData) => {
        if (!oldData) return { messages: [message] };
        return { ...oldData, messages: [...oldData.messages, message] };
      });
    },
  });

  useEffect(() => {
    if (!authUser?._id) return;
    const socket = io("http://localhost:5000", {
      withCredentials: true,
      auth: { userId: authUser._id },
    });

    socket.on("message:new", (message) => {
      if (!message?.sender || !message?.receiver) return;
      const otherId =
        message.sender._id === authUser._id
          ? message.receiver._id
          : message.sender._id;
      queryClient.setQueryData(["messages", otherId], (oldData) => {
        if (!oldData) return { messages: [message] };
        return { ...oldData, messages: [...oldData.messages, message] };
      });

      if (message.receiver._id === authUser._id) {
        queryClient.setQueryData(["chatUnreadCounts"], (oldData) => {
          const counts = oldData?.counts || [];
          const existing = counts.find(
            (c) => c.senderId.toString() === message.sender._id.toString(),
          );
          if (existing) {
            return {
              counts: counts.map((c) =>
                c.senderId.toString() === message.sender._id.toString()
                  ? { ...c, count: c.count + 1 }
                  : c,
              ),
            };
          }
          return {
            counts: [...counts, { senderId: message.sender._id, count: 1 }],
          };
        });

        queryClient.invalidateQueries({
          queryKey: ["notificationsUnreadCount"],
        });

        if (selectedUser?._id !== message.sender._id) {
          toast.success(`New message from @${message.sender.username}`);
        }
      }
    });

    return () => socket.disconnect();
  }, [authUser?._id, queryClient, selectedUser?._id]);

  const messages = messagesData?.messages || [];

  useEffect(() => {
    if (!selectedUser?._id) return;
    if (!messagesData) return;
    queryClient.setQueryData(["chatUnreadCounts"], (oldData) => {
      const counts = oldData?.counts || [];
      return {
        counts: counts.filter(
          (c) => c.senderId.toString() !== selectedUser._id.toString(),
        ),
      };
    });
  }, [messagesData, queryClient, selectedUser?._id]);

  return (
    <div className="flex flex-1 border-r border-gray-700 min-h-screen">
      <div className="w-60 md:w-72 border-r border-gray-700 p-3 md:p-4">
        <h2 className="font-bold mb-3 md:mb-4 text-sm md:text-base">Mutuals</h2>
        {isMutualsLoading && <LoadingSpinner size="md" />}
        {!isMutualsLoading && mutuals.length === 0 && (
          <p className="text-slate-500">No mutuals to chat with.</p>
        )}
        <div className="flex flex-col gap-2">
          {mutuals.map((user) => (
            <button
              key={user._id}
              className={`flex items-center gap-2 p-2 rounded text-left hover:bg-[#1a1a1a] ${
                selectedUser?._id === user._id ? "bg-[#1a1a1a]" : ""
              }`}
              onClick={() => {
                setSelectedUser(user);
                queryClient.setQueryData(["chatUnreadCounts"], (oldData) => {
                  const counts = oldData?.counts || [];
                  return {
                    counts: counts.filter(
                      (c) => c.senderId.toString() !== user._id.toString(),
                    ),
                  };
                });
                queryClient.invalidateQueries({
                  queryKey: ["chatUnreadCounts"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["notificationsUnreadCount"],
                });
              }}
            >
              <div className="avatar">
                <div className="w-7 md:w-8 rounded-full">
                  <img src={user.profileImage || "/avatar-placeholder.png"} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold truncate w-32 md:w-40 text-sm md:text-base">
                  {user.fullName}
                </span>
                <span className="text-xs md:text-sm text-slate-500">
                  @{user.username}
                </span>
              </div>
              {unreadMap.get(user._id.toString()) > 0 && (
                <span className="ml-auto badge badge-primary badge-sm">
                  {unreadMap.get(user._id.toString())}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-700 p-4">
          <p className="font-bold">
            {selectedUser ? `Chat with @${selectedUser.username}` : "Messages"}
          </p>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          {isMessagesLoading && selectedUser && <LoadingSpinner size="md" />}
          {!selectedUser && (
            <p className="text-slate-500">Select a mutual to start chatting.</p>
          )}
          {selectedUser && messages.length === 0 && (
            <p className="text-slate-500">No messages yet.</p>
          )}
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`max-w-[70%] rounded p-2 ${
                  msg.sender._id === authUser._id
                    ? "ml-auto bg-primary text-white"
                    : "bg-[#1a1a1a]"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
        {selectedUser && (
          <form
            className="border-t border-gray-700 p-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!messageText.trim() || isSending) return;
              sendMessage();
            }}
          >
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <button className="btn btn-primary text-white" disabled={isSending}>
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
