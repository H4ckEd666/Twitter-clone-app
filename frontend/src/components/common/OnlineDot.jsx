import { useQuery } from "@tanstack/react-query";
import useSocket from "../../context/useSocket";

const OnlineDot = ({ userId, className = "" }) => {
  const { onlineUserIds } = useSocket();
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  if (!userId || !authUser?._id) return null;
  if (userId.toString() === authUser._id.toString()) return null;

  const isMutual =
    authUser?.following?.includes(userId) &&
    authUser?.followers?.includes(userId);

  if (!isMutual) return null;

  const isOnline = onlineUserIds.includes(userId.toString());
  if (!isOnline) return null;

  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black bg-green-500 ${className}`}
    />
  );
};

export default OnlineDot;
