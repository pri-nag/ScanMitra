import prisma from "./prisma";
import { BookingStatus } from "@prisma/client";

// ===== TOKEN ASSIGNMENT =====
// Assigns sequential token number per center per day
export async function assignToken(centerId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const lastBooking = await prisma.booking.findFirst({
    where: {
      centerId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { tokenNumber: "desc" },
  });

  return (lastBooking?.tokenNumber || 0) + 1;
}

// ===== ETA CALCULATION =====
// Calculates estimated wait time based on position and average service duration
export async function calculateETA(
  centerId: string,
  position: number,
  serviceId?: string
): Promise<number> {
  // Get average service duration for this center
  let avgDuration = 15; // default 15 minutes

  if (serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (service) {
      avgDuration = service.duration;
    }
  } else {
    const services = await prisma.service.findMany({
      where: { centerId, status: true },
    });
    if (services.length > 0) {
      avgDuration =
        services.reduce((sum, s) => sum + s.duration, 0) / services.length;
    }
  }

  return Math.round(position * avgDuration);
}

// ===== PROMOTE NEXT PATIENT =====
// After a patient is marked DONE, promote the next IN_QUEUE patient
export async function promoteNext(centerId: string): Promise<void> {
  const nextEntry = await prisma.queueEntry.findFirst({
    where: {
      centerId,
      status: "IN_QUEUE",
    },
    orderBy: { queueNo: "asc" },
    include: { booking: true },
  });

  if (nextEntry) {
    await prisma.$transaction([
      prisma.queueEntry.update({
        where: { id: nextEntry.id },
        data: {
          status: "IN_PROGRESS",
          calledAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: nextEntry.bookingId },
        data: { status: "IN_PROGRESS" },
      }),
    ]);
  }
}

// ===== APPLY DELAY =====
// Recalculate all downstream ETAs when delay is marked
export async function applyDelay(
  centerId: string,
  delayMins: number
): Promise<void> {
  await prisma.queueEntry.updateMany({
    where: {
      centerId,
      status: { in: ["IN_QUEUE", "CONFIRMED"] },
    },
    data: {
      delayMins: { increment: delayMins },
    },
  });
}

// ===== GET QUEUE POSITION =====
export async function getQueuePosition(
  bookingId: string
): Promise<{ position: number; eta: number; totalAhead: number } | null> {
  const entry = await prisma.queueEntry.findUnique({
    where: { bookingId },
    include: { booking: { include: { service: true } } },
  });

  if (!entry) return null;

  const aheadCount = await prisma.queueEntry.count({
    where: {
      centerId: entry.centerId,
      status: { in: ["IN_QUEUE", "IN_PROGRESS"] },
      queueNo: { lt: entry.queueNo },
    },
  });

  const avgDuration = entry.booking.service?.duration || 15;
  const eta = aheadCount * avgDuration + entry.delayMins;

  return {
    position: aheadCount + 1,
    eta,
    totalAhead: aheadCount,
  };
}

// ===== ASSIGN QUEUE NUMBER =====
export async function assignQueueNumber(centerId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const lastEntry = await prisma.queueEntry.findFirst({
    where: {
      centerId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { queueNo: "desc" },
  });

  return (lastEntry?.queueNo || 0) + 1;
}

// ===== VALID STATUS TRANSITIONS =====
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_QUEUE", "CANCELLED"],
  IN_QUEUE: ["IN_PROGRESS", "NO_SHOW", "CANCELLED"],
  IN_PROGRESS: ["DONE"],
  DONE: [],
  NO_SHOW: [],
  CANCELLED: [],
};

export function isValidTransition(
  from: BookingStatus,
  to: BookingStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

// ===== GENERATE TIME SLOTS =====
export function generateTimeSlots(
  openingTime: string,
  closingTime: string,
  durationMinutes: number
): string[] {
  const slots: string[] = [];
  const [openH, openM] = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);

  let currentMinutes = openH * 60 + openM;
  const closingMinutes = closeH * 60 + closeM;

  while (currentMinutes + durationMinutes <= closingMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    currentMinutes += durationMinutes;
  }

  return slots;
}
