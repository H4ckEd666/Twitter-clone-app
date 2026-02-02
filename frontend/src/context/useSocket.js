import { useContext } from "react";
import { SocketContext } from "./SocketContext";

const useSocket = () => useContext(SocketContext);

export default useSocket;
