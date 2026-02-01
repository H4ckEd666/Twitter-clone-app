import { Server } from "socket.io";

let io;
const userSocketMap = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const { userId } = socket.handshake.auth || {};
    if (userId) {
      userSocketMap.set(userId.toString(), socket.id);
    }

    socket.on("disconnect", () => {
      if (userId) {
        userSocketMap.delete(userId.toString());
      }
    });
  });

  return io;
};

export const getIo = () => io;
export const getSocketIdByUserId = (userId) =>
  userSocketMap.get(userId.toString());
