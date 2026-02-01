import XSvg from "../svgs/X";

import { MdHomeFilled } from "react-icons/md";
import { IoNotifications } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaRegEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const Sidebar = () => {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async () => {
      // Placeholder for logout functionality
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Logout failed");
        }
        return data;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    onSuccess: () => {
      // Handle successful logout

      queryClient.invalidateQueries(["authUser"]);
      // You can redirect the user or update the global state here
    },
    onError: (error) => {
      // Handle logout error
      toast.error(error.message || "Logout failed. Please try again.");
    },
  });

  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
  });

  const { data: unreadData } = useQuery({
    queryKey: ["notificationsUnreadCount"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count");
      const data = await res.json().catch(() => ({ count: 0 }));
      if (!res.ok) {
        throw new Error(data.error || "Failed to load unread count");
      }
      return data;
    },
    enabled: Boolean(authUser),
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;

  const { data: chatUnreadData } = useQuery({
    queryKey: ["chatUnreadCounts"],
    queryFn: async () => {
      const res = await fetch("/api/chat/unread");
      const data = await res.json().catch(() => ({ counts: [] }));
      if (!res.ok) {
        throw new Error(data.message || "Failed to load chat unread");
      }
      return data;
    },
    enabled: Boolean(authUser),
    refetchInterval: 15000,
  });

  const chatUnreadTotal =
    chatUnreadData?.counts?.reduce((acc, item) => acc + item.count, 0) || 0;

  return (
    <div className="md:flex-[2_2_0] w-full md:w-18 md:max-w-52">
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 flex-row items-center justify-around border-t border-gray-700 bg-black/95 backdrop-blur md:sticky md:top-0 md:h-screen md:flex-col md:items-start md:justify-start md:border-t-0 md:border-r md:bg-transparent">
        <Link to="/" className="hidden md:flex md:justify-start">
          <XSvg className="px-2 w-12 h-12 rounded-full fill-white hover:bg-stone-900" />
        </Link>
        <ul className="flex w-full flex-row items-center justify-around gap-3 md:mt-4 md:flex-col md:items-start md:justify-start">
          <li className="flex justify-center md:justify-start">
            <Link
              to="/"
              className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
            >
              <MdHomeFilled className="w-8 h-8" />
              <span className="text-lg hidden md:block">Home</span>
            </Link>
          </li>
          <li className="flex justify-center md:justify-start">
            <Link
              to="/notifications"
              className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
            >
              <div className="relative">
                <IoNotifications className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] leading-4 text-white text-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-lg hidden md:block">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 badge badge-primary badge-sm">
                    {unreadCount}
                  </span>
                )}
              </span>
            </Link>
          </li>

          <li className="flex justify-center md:justify-start">
            <Link
              to="/messages"
              className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
            >
              <div className="relative">
                <FaRegEnvelope className="w-6 h-6" />
                {chatUnreadTotal > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] leading-4 text-white text-center">
                    {chatUnreadTotal}
                  </span>
                )}
              </div>
              <span className="text-lg hidden md:block">Messages</span>
            </Link>
          </li>

          <li className="flex justify-center md:justify-start">
            <Link
              to={`/profile/${authUser?.username}`}
              className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
            >
              <FaUser className="w-6 h-6" />
              <span className="text-lg hidden md:block">Profile</span>
            </Link>
          </li>
        </ul>
        {authUser && (
          <Link
            to={`/profile/${authUser.username}`}
            className="mt-auto mb-10 hidden gap-2 items-start transition-all duration-300 hover:bg-[#181818] py-2 px-4 rounded-full md:flex"
          >
            <div className="avatar hidden md:inline-flex">
              <div className="w-8 rounded-full">
                <img src={authUser?.profileImg || "/avatar-placeholder.png"} />
              </div>
            </div>
            <div className="flex justify-between flex-1">
              <div className="hidden md:block">
                <p className="text-white font-bold text-sm w-20 truncate">
                  {authUser?.fullName}
                </p>
                <p className="text-slate-500 text-sm">@{authUser?.username}</p>
              </div>
              <BiLogOut
                onClick={(e) => {
                  e.preventDefault();
                  mutate();
                }}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};
export default Sidebar;
