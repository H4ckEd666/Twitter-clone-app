import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import { SocketContext } from "./SocketContext";

const SocketProvider = ({ children }) => {
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [socketInstance, setSocketInstance] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!authUser?._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
      auth: { userId: authUser._id },
    });

    socketRef.current = newSocket;

    const handleOnline = (ids) => {
      setOnlineUserIds(Array.isArray(ids) ? ids : []);
    };

    const handleConnect = () => {
      setSocketInstance(newSocket);
    };

    const handleDisconnect = () => {
      setSocketInstance(null);
      setOnlineUserIds([]);
    };

    newSocket.on("users:online", handleOnline);
    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);

    return () => {
      newSocket.disconnect();
      newSocket.off("users:online", handleOnline);
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      if (socketRef.current === newSocket) {
        socketRef.current = null;
      }
    };
  }, [authUser?._id]);

  const value = useMemo(
    () => ({ socket: socketInstance, onlineUserIds }),
    [socketInstance, onlineUserIds],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
