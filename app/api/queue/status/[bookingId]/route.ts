import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getQueuePosition } from "@/lib/queue";
import { jsonNoStore } from "@/lib/http-cache";

// GET /api/queue/status/[bookingId] - Get patient's queue status
export async function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const [booking, queueInfo] = await Promise.all([
      prisma.booking.findUnique({
        where: { id: params.bookingId },
        select: {
          id: true,
          userId: true,
          centerId: true,
          patientName: true,
          patientPhone: true,
          slotTime: true,
          tokenNumber: true,
          status: true,
          additionalInfo: true,
          service: { select: { id: true, name: true, duration: true, price: true } },
          queueEntry: { select: { id: true, queueNo: true, status: true, delayMins: true } },
        },
      }),
      getQueuePosition(params.bookingId),
    ]);

    if (!booking) {
      return jsonNoStore({ error: "Booking not found" }, 404);
    }

    return jsonNoStore({
      booking,
      queuePosition: queueInfo?.position || 0,
      estimatedWait: queueInfo?.eta || 0,
      totalAhead: queueInfo?.totalAhead || 0,
    });
  } catch (error) {
    console.error("Queue status error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
