"use client";

import Link from "next/link";
import StatusBadge from "@/components/shared/StatusBadge";

type BookingShape = {
  id: string;
  status: string;
  slotTime: string;
  tokenNumber: number;
  center?: { centerName?: string };
  service?: { name?: string };
};

export default function BookingCard({ booking, onCancel }: { booking: BookingShape; onCancel?: (id: string) => void }) {
  const data = booking;
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{data.center?.centerName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.service?.name} · Token #{data.tokenNumber}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(data.slotTime).toLocaleString("en-IN")}
          </p>
        </div>
        <StatusBadge status={data.status} />
      </div>
      <div className="flex gap-2 mt-4">
        <Link href={`/user/queue-status/${data.id}`} className="px-3 py-2 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          Queue Status
        </Link>
        {data.status !== "CANCELLED" && data.status !== "DONE" && (
          <button
            onClick={() => onCancel?.(data.id)}
            className="px-3 py-2 rounded-lg text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
