import prisma from "@/lib/prisma";
import {
  createWorker,
  noShowQueue,
  reminderQueue,
  scheduleJob,
  slotTimeQueue,
} from "@/lib/bullmq";

const MINUTE = 60 * 1000;

createWorker("reminderQueue", async (job) => {
  const { bookingId } = job.data as { bookingId: string };
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
  });
});

createWorker("slotTimeQueue", async (job) => {
  const { bookingId } = job.data as { bookingId: string };
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "IN_QUEUE" },
  });
});

createWorker("noShowQueue", async (job) => {
  const { bookingId } = job.data as { bookingId: string };
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (booking?.status === "IN_QUEUE") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "NO_SHOW" },
    });
  }
});

export async function scheduleBookingJobs(bookingId: string, slotTime: Date) {
  const now = Date.now();
  const slotAt = new Date(slotTime).getTime();

  await Promise.all([
    scheduleJob(reminderQueue, "booking_reminder", { bookingId }, {
      delay: Math.max(slotAt - now - 60 * MINUTE, 0),
      priority: 3,
    }),
    scheduleJob(slotTimeQueue, "booking_slot_time", { bookingId }, {
      delay: Math.max(slotAt - now, 0),
      priority: 2,
    }),
    scheduleJob(noShowQueue, "booking_noshow", { bookingId }, {
      delay: Math.max(slotAt - now + 30 * MINUTE, 0),
      priority: 1,
    }),
  ]);
}
