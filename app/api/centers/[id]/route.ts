import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { generateTimeSlots } from "@/lib/queue";
import { calculateCapacities, getSlotStatus } from "@/lib/slots";
import { cacheGet, cacheSet } from "@/lib/redis-cache";
import { jsonNoStore, jsonPublicCache } from "@/lib/http-cache";

// GET /api/centers/[id] - Single center detail with services & slots
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const serviceId = searchParams.get("serviceId");
    const cacheKey = `centers:detail:${params.id}:${date}:${serviceId || "first"}`;
    const cached = await cacheGet<{ center: unknown; slots: { time: string; available: boolean }[] }>(cacheKey);
    if (cached) {
      return jsonPublicCache(cached, 30, 90);
    }

    const center = await prisma.center.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        centerName: true,
        address: true,
        availableScans: true,
        openingTime: true,
        closingTime: true,
        dailyPatientCapacity: true,
        emergencySupport: true,
        services: {
          where: { status: true },
          select: { id: true, name: true, duration: true, price: true, status: true },
        },
        _count: { select: { bookings: true, queueEntries: true } },
      },
    });

    if (!center) {
      return jsonNoStore({ error: "Center not found" }, 404);
    }

    // Generate time slots for the selected date
    let slots: { time: string; available: boolean }[] = [];

    const selectedService = serviceId
      ? center.services.find((s) => s.id === serviceId)
      : center.services[0];

    if (selectedService) {
      const allSlots = generateTimeSlots(
        center.openingTime,
        center.closingTime,
        selectedService.duration
      );

      // Check bookings for each slot
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const existingBookings = await prisma.booking.findMany({
        where: {
          centerId: center.id,
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

      const totalPerSlot = Math.max(1, Math.floor((selectedService.totalSlots || 10) / 1)); // Assuming totalSlots is per time slot for simplicity, or we can distribute it.
      // Re-reading requirements: "10 slots per day" -> let's divide it across slots.
      const avgCapacityPerSlot = Math.max(1, Math.floor((selectedService.totalSlots || 10) / allSlots.length));
      
      const { onlineCapacity, walkInCapacity } = calculateCapacities(avgCapacityPerSlot);

      slots = allSlots.map((time) => {
        const online = onlineBookingsPerSlot.get(time) || 0;
        const walkin = walkInBookingsPerSlot.get(time) || 0;
        return {
          time,
          onlineBooked: online,
          walkInBooked: walkin,
          onlineCapacity,
          walkInCapacity,
          status: getSlotStatus(online, walkin, onlineCapacity, walkInCapacity),
          available: getSlotStatus(online, walkin, onlineCapacity, walkInCapacity) === "available"
        };
      });
    }

    const payload = { center, slots };
    await cacheSet(cacheKey, payload, 30);
    return jsonPublicCache(payload, 30, 90);
  } catch (error) {
    console.error("Get center detail error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
