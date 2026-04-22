import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { bookingSchema } from "@/lib/validations";
import { assignToken, assignQueueNumber } from "@/lib/queue";
import { scheduleBookingJobs } from "@/lib/scheduler";
import { emitQueueUpdate } from "@/lib/socket-server";
import { cacheDel } from "@/lib/redis-cache";
import { jsonNoStore } from "@/lib/http-cache";

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

    const { centerId, serviceId, patientName, patientPhone, slotTime, additionalInfo } =
      validation.data;

    // Verify center and service exist
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { id: true, services: { select: { id: true } } },
    });

    if (!center) {
      return jsonNoStore({ error: "Center not found" }, 404);
    }

    const service = center.services.find((s) => s.id === serviceId);
    if (!service) {
      return jsonNoStore({ error: "Service not found" }, 404);
    }

    // Assign token number
    const tokenNumber = await assignToken(centerId);
    const queueNo = await assignQueueNumber(centerId);
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        centerId,
        serviceId,
        patientName,
        patientPhone,
        slotTime: new Date(slotTime),
        tokenNumber,
        status: "PENDING",
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
        center: { select: { id: true, centerName: true, address: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
      },
    });

    await prisma.queueEntry.create({
      data: {
        bookingId: booking.id,
        centerId,
        queueNo,
        status: "PENDING",
      },
    });

    await scheduleBookingJobs(booking.id, booking.slotTime);
    emitQueueUpdate(centerId, {
      bookingId: booking.id,
      status: "PENDING",
      queueNo,
      eta: null,
    });

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
