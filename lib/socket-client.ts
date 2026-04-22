"use client";

import { io as ioClient, Socket } from "socket.io-client";

let clientSocket: Socket | null = null;

export function getSocketClient() {
  if (typeof window === "undefined") return null;
  if (!clientSocket) {
    clientSocket = ioClient({
      path: "/api/socket",
      transports: ["websocket"],
    });
  }
  return clientSocket;
}
