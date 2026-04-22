import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { emitQueueUpdate } from "@/lib/socket-server";
import { jsonNoStore } from "@/lib/http-cache";

// PATCH /api/queue/call/[id] - Mark patient as IN_PROGRESS (Call Next)
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
        data: { status: "IN_PROGRESS", calledAt: new Date() },
      }),
      prisma.booking.update({
        where: { id: entry.bookingId },
        data: { status: "IN_PROGRESS" },
      }),
    ]);

    emitQueueUpdate(entry.centerId, {
      bookingId: entry.bookingId,
      status: "IN_PROGRESS",
      queueNo: entry.queueNo,
      calledAt: new Date().toISOString(),
    });

    return jsonNoStore({ message: "Patient called successfully" });
  } catch (error) {
    console.error("Call patient error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
