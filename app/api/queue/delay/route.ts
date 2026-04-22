import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { applyDelay } from "@/lib/queue";
import { emitDelay } from "@/lib/socket-server";
import { jsonNoStore } from "@/lib/http-cache";

// PATCH /api/queue/delay - Broadcast delay to all patients
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CENTER") {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { delayMins } = body;

    if (!delayMins || delayMins < 1) {
      return NextResponse.json({ error: "Delay minutes must be positive" }, { status: 400 });
    }

    const center = await prisma.center.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!center) {
      return jsonNoStore({ error: "Center not found" }, 404);
    }

    await applyDelay(center.id, delayMins);

    const updatedQueue = await prisma.queueEntry.findMany({
      where: {
        centerId: center.id,
        status: { in: ["IN_QUEUE", "CONFIRMED", "IN_PROGRESS"] },
      },
      select: { bookingId: true, queueNo: true, delayMins: true },
      orderBy: { queueNo: "asc" },
    });

    emitDelay(center.id, {
      centerId: center.id,
      delayMins,
      updatedETA: updatedQueue.map((entry) => ({
        bookingId: entry.bookingId,
        queueNo: entry.queueNo,
        delayMins: entry.delayMins,
      })),
    });

    return jsonNoStore({
      message: `Delay of ${delayMins} minutes applied to all upcoming patients`,
    });
  } catch (error) {
    console.error("Delay broadcast error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
