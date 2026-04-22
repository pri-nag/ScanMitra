"use client";

import StatusBadge from "@/components/shared/StatusBadge";

export default function QueueStatusCard({
  booking,
  queuePosition,
  estimatedWait,
}: {
  booking: { status: string; tokenNumber: number };
  queuePosition: number;
  estimatedWait: number;
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Queue Status</h2>
        <StatusBadge status={booking.status} />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-5 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Token</p>
          <p className="text-2xl font-bold text-primary">#{booking.tokenNumber}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Position</p>
          <p className="text-2xl font-bold">{queuePosition}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">ETA</p>
          <p className="text-2xl font-bold">{estimatedWait}m</p>
        </div>
      </div>
    </div>
  );
}
