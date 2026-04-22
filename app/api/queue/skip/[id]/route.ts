import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { emitQueueUpdate } from "@/lib/socket-server";
import { jsonNoStore } from "@/lib/http-cache";

// PATCH /api/queue/skip/[id] - Skip/remove patient from queue
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
        data: { status: "NO_SHOW" },
      }),
      prisma.booking.update({
        where: { id: entry.bookingId },
        data: { status: "NO_SHOW" },
      }),
    ]);

    emitQueueUpdate(entry.centerId, {
      bookingId: entry.bookingId,
      status: "NO_SHOW",
      queueNo: entry.queueNo,
    });

    return jsonNoStore({ message: "Patient marked as no-show" });
  } catch (error) {
    console.error("Skip patient error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
