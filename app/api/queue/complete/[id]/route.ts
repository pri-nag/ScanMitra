import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { promoteNext } from "@/lib/queue";
import { emitQueueUpdate } from "@/lib/socket-server";
import { jsonNoStore } from "@/lib/http-cache";

// PATCH /api/queue/complete/[id] - Mark patient as DONE, promote next
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CENTER") {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const entry = await prisma.queueEntry.findUnique({
      where: { id: params.id },
      select: { id: true, bookingId: true, centerId: true, queueNo: true },
    });

    if (!entry) {
      return jsonNoStore({ error: "Queue entry not found" }, 404);
    }

    await prisma.$transaction([
      prisma.queueEntry.update({
        where: { id: params.id },
        data: { status: "DONE", doneAt: new Date() },
      }),
      prisma.booking.update({
        where: { id: entry.bookingId },
        data: { status: "DONE" },
      }),
    ]);

    emitQueueUpdate(entry.centerId, {
      bookingId: entry.bookingId,
      status: "DONE",
      queueNo: entry.queueNo,
      doneAt: new Date().toISOString(),
    });

    // Auto-promote next patient
    await promoteNext(entry.centerId);

    const next = await prisma.queueEntry.findFirst({
      where: { centerId: entry.centerId, status: "IN_PROGRESS" },
      orderBy: { queueNo: "asc" },
      select: { bookingId: true, queueNo: true },
    });
    if (next) {
      emitQueueUpdate(entry.centerId, {
        bookingId: next.bookingId,
        status: "IN_PROGRESS",
        queueNo: next.queueNo,
      });
    }

    return jsonNoStore({ message: "Patient completed, next promoted" });
  } catch (error) {
    console.error("Complete patient error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
