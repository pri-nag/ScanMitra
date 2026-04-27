import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { assignToken, assignQueueNumber, generateTimeSlots } from "@/lib/queue";
import { calculateCapacities, canBook } from "@/lib/slots";
import { scheduleBookingJobs } from "@/lib/scheduler";
import { emitQueueUpdate, emitNewBooking } from "@/lib/socket-server";
import { jsonNoStore } from "@/lib/http-cache";

// POST /api/bookings/walkin - Create a walk-in booking (Center Staff only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CENTER") {
      return jsonNoStore({ error: "Unauthorized. Center access only." }, 401);
    }

    const body = await req.json();
    const { centerId, serviceId, patientName, patientPhone, slotTime, additionalInfo } = body;

    if (!centerId || !serviceId || !patientName || !patientPhone || !slotTime) {
      return jsonNoStore({ error: "Missing required fields" }, 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const service = await tx.service.findUnique({
        where: { id: serviceId },
        include: { center: true }
      });

      if (!service || service.centerId !== centerId) {
        throw new Error("Service not found or mismatch");
      }

      const targetTime = new Date(slotTime);
      const bookingsInSlot = await tx.booking.findMany({
        where: {
          serviceId,
          slotTime: targetTime,
          status: { notIn: ["CANCELLED"] }
        },
        select: { bookingType: true }
      });

      const onlineBooked = bookingsInSlot.filter(b => b.bookingType === "ONLINE").length;
      const walkInBooked = bookingsInSlot.filter(b => b.bookingType === "WALK_IN").length;

      const allSlotsCount = generateTimeSlots(service.center.openingTime, service.center.closingTime, service.duration).length;
      const avgCapacityPerSlot = Math.max(1, Math.floor((service.totalSlots || 10) / allSlotsCount));
      const { onlineCapacity, walkInCapacity } = calculateCapacities(avgCapacityPerSlot);

      const validation = canBook("WALK_IN" as any, onlineBooked, walkInBooked, onlineCapacity, walkInCapacity);
      if (!validation.allowed) {
        throw new Error(validation.error);
      }

      const tokenNumber = await assignToken(centerId);
      const queueNo = await assignQueueNumber(centerId);

      const booking = await tx.booking.create({
        data: {
          userId: session.user.id, // Center user ID
          centerId,
          serviceId,
          patientName,
          patientPhone,
          slotTime: targetTime,
          tokenNumber,
          status: "IN_QUEUE", // Walk-ins usually go straight to queue
          bookingType: "WALK_IN",
          additionalInfo,
        },
        select: {
          id: true,
          tokenNumber: true,
          patientName: true,
          bookingType: true,
        }
      });

      await tx.queueEntry.create({
        data: {
          bookingId: booking.id,
          centerId,
          queueNo,
          status: "IN_QUEUE",
          isWalkIn: true
        },
      });

      return { booking, warning: validation.warning };
    });

    emitQueueUpdate(centerId, { bookingId: result.booking.id, status: "IN_QUEUE" });
    emitNewBooking(centerId, result.booking);

    return jsonNoStore({ 
      booking: result.booking, 
      message: "Walk-in booking created successfully",
      warning: result.warning 
    }, 201);
  } catch (error: any) {
    console.error("Walk-in booking error:", error);
    return jsonNoStore({ error: error.message || "Internal server error" }, 500);
  }
}
