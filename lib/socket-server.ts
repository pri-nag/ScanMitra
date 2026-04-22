import { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export function initSocketServer(server: HTTPServer) {
  if (io) return io;

  io = new IOServer(server, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_queue_room", ({ bookingId }: { bookingId: string }) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on("join_center_room", ({ centerId }: { centerId: string }) => {
      socket.join(`center:${centerId}`);
    });
  });

  return io;
}

export function emitQueueUpdate(centerId: string, payload: unknown) {
  io?.to(`center:${centerId}`).emit("queue_update", payload);
  const bookingId = (payload as { bookingId?: string }).bookingId;
  if (bookingId) io?.to(`booking:${bookingId}`).emit("queue_update", payload);
}

export function emitDelay(centerId: string, payload: unknown) {
  io?.to(`center:${centerId}`).emit("delay_broadcast", payload);
}
