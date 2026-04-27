import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { generateTimeSlots } from "@/lib/queue";
import { calculateCapacities, getSlotStatus } from "@/lib/slots";
import { jsonNoStore } from "@/lib/http-cache";

// GET /api/slots?centerId=&serviceId=&date=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const centerId = searchParams.get("centerId");
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!centerId || !serviceId) {
      return jsonNoStore({ error: "centerId and serviceId are required" }, 400);
    }

    const [center, service] = await Promise.all([
      prisma.center.findUnique({
        where: { id: centerId },
        select: { id: true, openingTime: true, closingTime: true }
      }),
      prisma.service.findUnique({
        where: { id: serviceId },
        select: { id: true, duration: true, totalSlots: true }
      })
    ]);

    if (!center || !service) {
      return jsonNoStore({ error: "Center or Service not found" }, 404);
    }

    const allSlots = generateTimeSlots(
      center.openingTime,
      center.closingTime,
      service.duration
    );

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.booking.findMany({
      where: {
        centerId: center.id,
        serviceId: service.id,
        slotTime: { gte: dayStart, lte: dayEnd },
        status: { notIn: ["CANCELLED"] },
      },
      select: { slotTime: true, bookingType: true },
    });

    const onlineBookingsPerSlot = new Map<string, number>();
    const walkInBookingsPerSlot = new Map<string, number>();

    existingBookings.forEach((b) => {
      const slotKey = `${b.slotTime.getHours().toString().padStart(2, "0")}:${b.slotTime.getMinutes().toString().padStart(2, "0")}`;
      if (b.bookingType === "ONLINE") {
        onlineBookingsPerSlot.set(slotKey, (onlineBookingsPerSlot.get(slotKey) || 0) + 1);
      } else {
        walkInBookingsPerSlot.set(slotKey, (walkInBookingsPerSlot.get(slotKey) || 0) + 1);
      }
    });

    const avgCapacityPerSlot = Math.max(1, Math.floor((service.totalSlots || 10) / allSlots.length));
    const { onlineCapacity, walkInCapacity } = calculateCapacities(avgCapacityPerSlot);

    const slots = allSlots.map((time) => {
      const onlineBooked = onlineBookingsPerSlot.get(time) || 0;
      const walkInBooked = walkInBookingsPerSlot.get(time) || 0;
      const status = getSlotStatus(onlineBooked, walkInBooked, onlineCapacity, walkInCapacity);

      return {
        time,
        onlineBooked,
        walkInBooked,
        onlineCapacity,
        walkInCapacity,
        totalCapacity: onlineCapacity + walkInCapacity,
        status,
        available: status === "available"
      };
    });

    return jsonNoStore({ slots, onlineCapacity, walkInCapacity });
  } catch (error) {
    console.error("Get slots error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
