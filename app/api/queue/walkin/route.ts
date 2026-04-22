import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { walkInSchema } from "@/lib/validations";
import { assignToken, assignQueueNumber } from "@/lib/queue";
import { jsonNoStore } from "@/lib/http-cache";

// POST /api/queue/walkin - Add walk-in patient to queue
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CENTER") {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const validation = walkInSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { patientName, email, mobile, serviceId } = validation.data;

    // Get center
    const center = await prisma.center.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!center) {
      return jsonNoStore({ error: "Center not found" }, 404);
    }

    // Find or create user for walk-in
    let walkInUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!walkInUser) {
      walkInUser = await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash("WalkIn@123", 10),
          role: "USER",
        },
        select: { id: true, email: true },
      });
    }

    // Create booking
    const tokenNumber = await assignToken(center.id);
    const booking = await prisma.booking.create({
      data: {
        userId: walkInUser.id,
        centerId: center.id,
        serviceId,
        patientName,
        patientPhone: mobile,
        slotTime: new Date(),
        tokenNumber,
        status: "IN_QUEUE",
      },
      select: {
        id: true,
        tokenNumber: true,
        centerId: true,
        serviceId: true,
        patientName: true,
        patientPhone: true,
        slotTime: true,
        status: true,
      },
    });

    // Create queue entry
    const queueNo = await assignQueueNumber(center.id);
    const queueEntry = await prisma.queueEntry.create({
      data: {
        bookingId: booking.id,
        centerId: center.id,
        queueNo,
        status: "IN_QUEUE",
        isWalkIn: true,
      },
      select: {
        id: true,
        bookingId: true,
        centerId: true,
        queueNo: true,
        status: true,
        isWalkIn: true,
      },
    });

    return jsonNoStore(
      { booking, queueEntry, message: "Walk-in added to queue" },
      201
    );
  } catch (error) {
    console.error("Walk-in error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
