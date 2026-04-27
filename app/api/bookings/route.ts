import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { bookingSchema } from "@/lib/validations";
import { assignToken, assignQueueNumber, generateTimeSlots } from "@/lib/queue";
import { calculateCapacities, canBook } from "@/lib/slots";
import { scheduleBookingJobs } from "@/lib/scheduler";
import { emitQueueUpdate, emitNewBooking, emitSlotUpdate } from "@/lib/socket-server";
import { cacheDel } from "@/lib/redis-cache";
import { jsonNoStore } from "@/lib/http-cache";

export const dynamic = "force-dynamic";

// POST /api/bookings - Create a new booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const validation = bookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { centerId, serviceId, patientName, patientPhone, slotTime, additionalInfo, bookingType = "ONLINE" } =
      validation.data;

    // Use a transaction to ensure atomicity and prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Service and Center details
      const service = await tx.service.findUnique({
        where: { id: serviceId },
        include: { center: true }
      });

      if (!service || service.centerId !== centerId) {
        throw new Error("Service not found or mismatch");
      }

      // 2. Count existing bookings for this specific slot time
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

      // 3. Calculate capacities (split across time slots)
      const allSlotsCount = generateTimeSlots(service.center.openingTime, service.center.closingTime, service.duration).length;
      const avgCapacityPerSlot = Math.max(1, Math.floor((service.totalSlots || 10) / allSlotsCount));
      const { onlineCapacity, walkInCapacity } = calculateCapacities(avgCapacityPerSlot);

      // 4. Validate capacity
      const validation = canBook(bookingType as any, onlineBooked, walkInBooked, onlineCapacity, walkInCapacity);
      if (!validation.allowed) {
        throw new Error(validation.error);
      }

      // 5. Assign token and create booking
      const tokenNumber = await assignToken(centerId); // Note: this uses prisma outside tx, ideally move logic inside
      const queueNo = await assignQueueNumber(centerId);

      const booking = await tx.booking.create({
        data: {
          userId: session.user.id,
          centerId,
          serviceId,
          patientName,
          patientPhone,
          slotTime: targetTime,
          tokenNumber,
          status: "PENDING",
          bookingType: bookingType as any,
          additionalInfo,
        },
        select: {
          id: true,
          centerId: true,
          serviceId: true,
          patientName: true,
          patientPhone: true,
          slotTime: true,
          tokenNumber: true,
          status: true,
          bookingType: true,
          center: { select: { id: true, centerName: true, address: true } },
          service: { select: { id: true, name: true, duration: true, price: true } },
        },
      });

      await tx.queueEntry.create({
        data: {
          bookingId: booking.id,
          centerId,
          queueNo,
          status: "PENDING",
        },
      });

      return { booking, tokenNumber, queueNo, warning: validation.warning };
    });

    const { booking, tokenNumber, queueNo, warning } = result;

    await scheduleBookingJobs(booking.id, booking.slotTime);
    emitQueueUpdate(centerId, {
      bookingId: booking.id,
      status: "PENDING",
      queueNo,
      eta: null,
    });
    emitNewBooking(centerId, {
      bookingId: booking.id,
      patientName: booking.patientName,
      tokenNumber: booking.tokenNumber,
      slotTime: booking.slotTime,
    });
    emitSlotUpdate(centerId, { slotTime: booking.slotTime });

    const slotDate = new Date(slotTime).toISOString().split("T")[0];
    await cacheDel([
      `centers:detail:${centerId}:${slotDate}:${serviceId}`,
      `centers:detail:${centerId}:${slotDate}:first`,
      "centers:list:::1:12",
    ]);

    return jsonNoStore(
      {
        booking,
        message: "Booking created successfully",
        tokenNumber,
      },
      201
    );
  } catch (error) {
    console.error("Create booking error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}

// GET /api/bookings - Get user's bookings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const { searchParams } = new URL(req.url);
    const centerId = searchParams.get("centerId");
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") || 20), 1), 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.BookingWhereInput = {};

    if (session.user.role === "USER") {
      where.userId = session.user.id;
    } else if (session.user.role === "CENTER" && centerId) {
      where.centerId = centerId;
    } else if (session.user.role === "CENTER") {
      // Get center's own bookings
      const center = await prisma.center.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (center) {
        where.centerId = center.id;
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          slotTime: true,
          tokenNumber: true,
          status: true,
          additionalInfo: true,
          center: { select: { id: true, centerName: true, address: true } },
          service: { select: { id: true, name: true, duration: true, price: true } },
          queueEntry: { select: { id: true, queueNo: true, status: true } },
        },
        orderBy: { slotTime: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.booking.count({ where }),
    ]);

    return jsonNoStore({ bookings, total, page, pageSize });
  } catch (error) {
    console.error("Get bookings error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
