import { Queue, Worker, JobsOptions, Job } from "bullmq";
import IORedis from "ioredis";

const redisUrl =
  process.env.REDIS_URL ||
  process.env.UPSTASH_REDIS_URL ||
  process.env.UPSTASH_REDIS_BULLMQ_URL;

const connection = redisUrl
  ? new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: redisUrl.includes("upstash.io") ? {} : undefined,
    })
  : null;

if (!connection) {
  // eslint-disable-next-line no-console
  console.warn(
    "BullMQ disabled: set REDIS_URL or UPSTASH_REDIS_URL (TCP Redis URL) to enable workers."
  );
}

function queueOrNull(name: string) {
  if (!connection) return null;
  return new Queue(name, { connection });
}

export const reminderQueue = queueOrNull("reminderQueue");
export const slotTimeQueue = queueOrNull("slotTimeQueue");
export const noShowQueue = queueOrNull("noShowQueue");

export function createWorker(
  queueName: string,
  processor: (job: Job) => Promise<void>
) {
  if (!connection) return null;
  return new Worker(queueName, processor, { connection });
}

export async function scheduleJob(
  queue: Queue | null,
  name: string,
  data: Record<string, unknown>,
  opts?: JobsOptions
) {
  if (!queue) return null;
  return queue.add(name, data, opts);
}
