"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "@/components/shared/Navbar";
import { getSocketClient } from "@/lib/socket-client";
import {
  Hash, Clock, Users, CheckCircle, AlertTriangle,
  ArrowLeft, RefreshCw, Stethoscope, Building2,
  Calendar, Wifi, WifiOff, X
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

type QueueStatusResponse = {
  booking: {
    id: string;
    centerId: string;
    status: string;
    tokenNumber: number;
    patientName: string;
    slotTime: string;
    center?: { centerName?: string };
    service?: { name?: string };
    queueEntry?: { delayMins?: number | null; queueNo?: number };
  };
  queuePosition: number;
  estimatedWait: number;
};

const STATUS_DISPLAY: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "Pending Confirmation", color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20" },
  CONFIRMED: { label: "Confirmed", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
  IN_QUEUE: { label: "In Queue", color: "text-cyan-400", bgColor: "bg-cyan-500/10 border-cyan-500/20" },
  IN_PROGRESS: { label: "Your Turn!", color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/20" },
  DONE: { label: "Completed", color: "text-green-400", bgColor: "bg-green-500/10 border-green-500/20" },
  NO_SHOW: { label: "No Show", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20" },
  CANCELLED: { label: "Cancelled", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
  MISSED: { label: "Slot Missed", color: "text-rose-500", bgColor: "bg-rose-500/10 border-rose-500/20" },
};

export default function QueueStatusPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<QueueStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showDelayBanner, setShowDelayBanner] = useState(false);
  const [eventDelay, setEventDelay] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`/api/queue/status/${id}`);
      setData(res.data);
      setLastRefresh(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial fetch
  useEffect(() => {
    if (!id) return;
    fetchStatus();
  }, [id, fetchStatus]);

  // Socket.io real-time updates
  useEffect(() => {
    if (!data?.booking) return;
    const socket = getSocketClient();
    if (!socket) return;

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onQueueUpdate = () => fetchStatus();
    const onQueueDelay = (payload: { delayMins: number }) => {
      setEventDelay(payload.delayMins);
      setShowDelayBanner(true);
      fetchStatus();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.emit("join_queue_room", { bookingId: data.booking.id });
    socket.emit("join_center_room", { centerId: data.booking.centerId });
    if (session?.user?.id) {
      socket.emit("join_user_room", { userId: session.user.id });
    }
    socket.on("queue_update", onQueueUpdate);
    socket.on("queue_delay", onQueueDelay);
    socket.on("slot_missed", (payload: { bookingId: string }) => {
      if (payload.bookingId === id) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <p className="font-medium text-rose-500">You missed your slot. Book another one?</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                router.push(`/user/center/${data.booking.centerId}`);
              }}
              className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              Rebook Now
            </button>
          </div>
        ), { duration: 10000 });
        fetchStatus();
      }
    });

    if (socket.connected) setSocketConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queue_update", onQueueUpdate);
      socket.off("queue_delay", onQueueDelay);
      socket.off("slot_missed");
    };
  }, [data?.booking, fetchStatus]);

  // Fallback polling every 10s
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [id, fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data?.booking) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="text-center pt-32">
          <p className="text-muted-foreground">Booking not found</p>
        </div>
      </div>
    );
  }

  const { booking, queuePosition, estimatedWait } = data;
  const statusInfo = STATUS_DISPLAY[booking.status] || STATUS_DISPLAY.PENDING;
  const delay = booking.queueEntry?.delayMins || 0;
  const totalWait = estimatedWait + delay;
  const isActive = ["IN_QUEUE", "IN_PROGRESS", "CONFIRMED"].includes(
    booking.status
  );
  const isYourTurn = booking.status === "IN_PROGRESS";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {/* Back */}
        <Link
          href="/user/bookings"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>

        {/* Connection Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {socketConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Polling</span>
              </>
            )}
          </div>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh · {lastRefresh.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </button>
        </div>

        {/* Delay Banner */}
        {showDelayBanner && eventDelay > 0 && (
          <div className="mb-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-400">
                  ⚠️ Center reported a {eventDelay}-minute delay
                </p>
                <p className="text-xs text-orange-400/70">
                  Your new estimated wait time is {totalWait} minutes.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDelayBanner(false)}
              className="p-1 hover:bg-orange-500/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-orange-400" />
            </button>
          </div>
        )}

        {/* Status Banner */}
        <div
          className={`rounded-2xl p-6 border mb-6 ${statusInfo.bgColor} ${
            isYourTurn ? "animate-pulse" : ""
          }`}
        >
          <p className="text-xs font-medium text-muted-foreground mb-1">
            STATUS
          </p>
          <p className={`text-2xl font-bold ${statusInfo.color}`}>
            {statusInfo.label}
          </p>
          {isYourTurn && (
            <p className="text-sm text-purple-400 mt-1">
              Please proceed to the center — you are being attended!
            </p>
          )}
        </div>

        {/* Token + Position + ETA */}
        {isActive && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-xl p-4 text-center">
              <Hash className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{booking.tokenNumber}</p>
              <p className="text-xs text-muted-foreground">Token</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Users className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {isYourTurn ? "NOW" : queuePosition}
              </p>
              <p className="text-xs text-muted-foreground">Position</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {isYourTurn ? "0" : totalWait}
              </p>
              <p className="text-xs text-muted-foreground">
                Est. min
              </p>
            </div>
          </div>
        )}

        {/* Booking Details */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Center:</span>
              <span className="font-medium">
                {booking.center?.centerName || "—"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Stethoscope className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">
                {booking.service?.name || "—"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Slot:</span>
              <span className="font-medium">
                {new Date(booking.slotTime).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {booking.status === "DONE" && (
              <div className="flex items-center gap-3 mt-4 p-3 bg-green-500/10 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">
                  Scan completed successfully!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Auto-refresh notice */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {socketConnected
            ? "Connected — updates arrive in real-time"
            : "Auto-refreshes every 10 seconds"}
        </p>
      </div>
    </div>
  );
}
