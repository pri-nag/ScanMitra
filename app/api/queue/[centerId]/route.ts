import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonNoStore } from "@/lib/http-cache";

// GET /api/queue/[centerId] - Get current queue for a center
export async function GET(
  req: NextRequest,
  { params }: { params: { centerId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") || 100), 1), 200);
    const skip = (page - 1) * pageSize;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [queueEntries, completedToday] = await Promise.all([
      prisma.queueEntry.findMany({
        where: {
          centerId: params.centerId,
          createdAt: { gte: today, lt: tomorrow },
          status: { notIn: ["CANCELLED", "DONE", "NO_SHOW"] },
        },
        select: {
          id: true,
          bookingId: true,
          queueNo: true,
          status: true,
          isWalkIn: true,
          delayMins: true,
          calledAt: true,
          booking: {
            select: {
              id: true,
              tokenNumber: true,
              patientName: true,
              patientPhone: true,
              status: true,
              service: { select: { id: true, name: true, duration: true, price: true } },
            },
          },
        },
        orderBy: { queueNo: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.queueEntry.count({
        where: {
          centerId: params.centerId,
          createdAt: { gte: today, lt: tomorrow },
          status: "DONE",
        },
      }),
    ]);

    return jsonNoStore({ queue: queueEntries, completedToday, page, pageSize });
  } catch (error) {
    console.error("Get queue error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
