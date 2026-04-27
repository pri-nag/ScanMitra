"use client";

import { Users, RefreshCw, Play, SkipForward, Loader2 } from "lucide-react";

type QueueEntry = {
  id: string;
  status: string;
  isWalkIn: boolean;
  bookingId: string;
  booking: {
    tokenNumber: number;
    patientName: string;
    patientPhone: string;
    service?: { name?: string };
  };
};

interface QueueTableProps {
  entries: QueueEntry[];
  onCall: (id: string) => void;
  onSkip: (id: string) => void;
  actionLoading: string | null;
  inProgressId?: string;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-500/15",
  CONFIRMED: "text-blue-400 bg-blue-500/15",
  IN_QUEUE: "text-cyan-400 bg-cyan-500/15",
  IN_PROGRESS: "text-purple-400 bg-purple-500/15",
  MISSED: "text-rose-500 bg-rose-500/15",
};

export default function QueueTable({
  entries,
  onCall,
  onSkip,
  actionLoading,
  inProgressId,
  onRefresh,
}: QueueTableProps) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Queue ({entries.length})
        </h2>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No patients in queue</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-xs text-muted-foreground text-left">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Patient</th>
                <th className="px-6 py-3 font-medium">Service</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const statusStyle = STATUS_COLORS[entry.status] || "";
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary">
                        #{entry.booking.tokenNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm">
                        {entry.booking.patientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.booking.patientPhone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {entry.booking.service?.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-md font-medium ${statusStyle}`}
                      >
                        {entry.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {entry.isWalkIn ? (
                        <span className="text-xs px-2 py-1 rounded-md bg-violet-500/15 text-violet-400 font-medium">
                          Walk-In
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-md bg-blue-500/15 text-blue-400 font-medium">
                          Online
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onCall(entry.id)}
                          disabled={!!actionLoading || !!inProgressId}
                          title={
                            inProgressId
                              ? "Complete current patient first"
                              : "Call this patient"
                          }
                          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {actionLoading === entry.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onSkip(entry.id)}
                          disabled={!!actionLoading}
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-30"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
