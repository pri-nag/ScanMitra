import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cacheDel } from "@/lib/redis-cache";
import { jsonNoStore } from "@/lib/http-cache";

// PATCH /api/bookings/[id] - Cancel or reschedule booking
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { action, slotTime } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        centerId: true,
        serviceId: true,
        slotTime: true,
        additionalInfo: true,
        queueEntry: { select: { id: true } },
      },
    });

    if (!booking) {
      return jsonNoStore({ error: "Booking not found" }, 404);
    }

    if (booking.userId !== session.user.id && session.user.role !== "CENTER") {
      return jsonNoStore({ error: "Unauthorized" }, 403);
    }

    if (action === "cancel") {
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: params.id },
          data: { status: "CANCELLED" },
        }),
        ...(booking.queueEntry
          ? [
              prisma.queueEntry.update({
                where: { id: booking.queueEntry.id },
                data: { status: "CANCELLED" },
              }),
            ]
          : []),
      ]);

      const dateKey = booking.slotTime.toISOString().split("T")[0];
      await cacheDel([
        `centers:detail:${booking.centerId}:${dateKey}:${booking.serviceId}`,
        `centers:detail:${booking.centerId}:${dateKey}:first`,
      ]);

      return jsonNoStore({ message: "Booking cancelled successfully" });
    }

    if (action === "reschedule" && slotTime) {
      await prisma.booking.update({
        where: { id: params.id },
        data: { slotTime: new Date(slotTime) },
      });

      const dateKey = new Date(slotTime).toISOString().split("T")[0];
      await cacheDel([
        `centers:detail:${booking.centerId}:${dateKey}:${booking.serviceId}`,
        `centers:detail:${booking.centerId}:${dateKey}:first`,
      ]);

      return jsonNoStore({ message: "Booking rescheduled successfully" });
    }

    if (action === "review" && body.review) {
      await prisma.booking.update({
        where: { id: params.id },
        data: { review: body.review },
      });

      return jsonNoStore({ message: "Review submitted successfully" });
    }

    if (action === "upload_report" && body.reportUrl) {
      const reportLine = `Report: ${String(body.reportUrl)}`;
      const mergedAdditionalInfo = booking.additionalInfo
        ? `${booking.additionalInfo}\n${reportLine}`
        : reportLine;

      await prisma.booking.update({
        where: { id: params.id },
        data: { additionalInfo: mergedAdditionalInfo },
      });

      return jsonNoStore({ message: "Report uploaded successfully" });
    }

    return jsonNoStore({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("Update booking error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
