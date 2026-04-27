import { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";

declare global {
  var io: IOServer | undefined;
}

export function initSocketServer(server: HTTPServer) {
  if (global.io) return global.io;

  global.io = new IOServer(server, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  global.io.on("connection", (socket) => {
    socket.on("join_queue_room", ({ bookingId }: { bookingId: string }) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on("join_center_room", ({ centerId }: { centerId: string }) => {
      socket.join(`center:${centerId}`);
    });

    socket.on("join_user_room", ({ userId }: { userId: string }) => {
      socket.join(`user:${userId}`);
    });
  });

  return global.io;
}

export function emitQueueUpdate(centerId: string, payload: unknown) {
  global.io?.to(`center:${centerId}`).emit("queue_update", payload);
  const bookingId = (payload as { bookingId?: string }).bookingId;
  if (bookingId) global.io?.to(`booking:${bookingId}`).emit("queue_update", payload);
}

export function emitDelay(centerId: string, payload: unknown) {
  global.io?.to(`center:${centerId}`).emit("queue_delay", payload);
  const updatedETA = (payload as { updatedETA?: Array<{ bookingId?: string }> }).updatedETA;
  if (Array.isArray(updatedETA)) {
    for (const entry of updatedETA) {
      if (entry.bookingId) {
        global.io?.to(`booking:${entry.bookingId}`).emit("queue_delay", payload);
      }
    }
  }
}

export function emitSlotMissed(userId: string, bookingId: string) {
  global.io?.to(`user:${userId}`).emit("slot_missed", { bookingId });
}

export function emitNewBooking(centerId: string, payload: unknown) {
  global.io?.to(`center:${centerId}`).emit("new_booking", payload);
}

export function emitSlotUpdate(centerId: string, payload: unknown) {
  global.io?.to(`center:${centerId}`).emit("slot_updated", payload);
}
