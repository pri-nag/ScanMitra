"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import Link from "next/link";
import {
  Calendar, Building2, Stethoscope, Hash,
  Loader2, CalendarX, Eye, Wifi, WifiOff
} from "lucide-react";
import { getSocketClient } from "@/lib/socket-client";
import axios from "axios";
import toast from "react-hot-toast";

type Booking = {
  id: string;
  status: string;
  slotTime: string;
  tokenNumber: number;
  patientName: string;
  patientPhone: string;
  additionalInfo?: string;
  center?: { centerName?: string; address?: string };
  service?: { name?: string; duration?: number; price?: number };
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PENDING: { label: "Pending", class: "text-yellow-400 bg-yellow-500/15" },
  CONFIRMED: { label: "Confirmed", class: "text-blue-400 bg-blue-500/15" },
  IN_QUEUE: { label: "In Queue", class: "text-cyan-400 bg-cyan-500/15" },
  IN_PROGRESS: { label: "In Progress", class: "text-purple-400 bg-purple-500/15" },
  DONE: { label: "Done", class: "text-green-400 bg-green-500/15" },
  NO_SHOW: { label: "No Show", class: "text-orange-400 bg-orange-500/15" },
  CANCELLED: { label: "Cancelled", class: "text-red-400 bg-red-500/15" },
  MISSED: { label: "Missed", class: "text-rose-500 bg-rose-500/15" },
};

export default function UserBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      const res = await axios.get("/api/bookings");
      setBookings(res.data.bookings || []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      loadBookings();

      const socket = getSocketClient();
      if (socket) {
        socket.emit("join_user_room", { userId: session.user.id });

        const onConnect = () => setSocketConnected(true);
        const onDisconnect = () => setSocketConnected(false);
        const onSlotMissed = () => {
          toast((t) => (
            <div className="flex flex-col gap-2">
              <p className="font-medium text-rose-500">You missed a slot. Book another one?</p>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push("/user/dashboard");
                }}
                className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                Rebook Now
              </button>
            </div>
          ), { duration: 10000 });
          loadBookings();
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("slot_missed", onSlotMissed);

        if (socket.connected) setSocketConnected(true);

        return () => {
          socket.off("connect", onConnect);
          socket.off("disconnect", onDisconnect);
          socket.off("slot_missed", onSlotMissed);
        };
      }
    }
  }, [status, session?.user?.id, loadBookings, router]);

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const isPast = ["DONE", "CANCELLED", "NO_SHOW", "MISSED"].includes(booking.status);
      return tab === "past" ? isPast : !isPast;
    });
  }, [bookings, tab]);

  const cancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(id);
    try {
      await axios.patch(`/api/bookings/${id}`, { action: "cancel" });
      toast.success("Booking cancelled");
      loadBookings();
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setCancelling(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#f8fafb]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
          <div className="h-10 skeleton rounded-xl w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 h-[220px]">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl skeleton" />
                    <div>
                      <div className="h-4 skeleton rounded-lg w-24 mb-2" />
                      <div className="h-3 skeleton rounded-lg w-32" />
                    </div>
                  </div>
                  <div className="w-20 h-6 skeleton rounded-lg" />
                </div>
                <div className="space-y-3 mb-6">
                  <div className="h-3 skeleton rounded-lg w-full" />
                  <div className="h-3 skeleton rounded-lg w-2/3" />
                </div>
                <div className="h-10 skeleton rounded-xl w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">My Bookings</h1>
            <p className="text-muted-foreground text-base">
              Manage your diagnostic appointments and track live queue status
            </p>
          </div>
          <button
            onClick={() => router.push("/user/dashboard")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold gradient-primary text-white hover:opacity-90 transition-all shadow-lg shadow-blue-500/25"
          >
            <Building2 className="w-4 h-4" /> Find New Center
          </button>
        </div>

        {/* Socket Status */}
        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-muted-foreground">
          {socketConnected ? (
            <div className="flex items-center gap-1.5 text-green-500">
              <Wifi className="w-3.5 h-3.5" />
              <span>Live Updates Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Connecting for updates...</span>
            </div>
          )}
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex rounded-2xl border border-border/50 p-1.5 mb-8 bg-white/50 backdrop-blur-sm shadow-sm">
          <button
            onClick={() => setTab("upcoming")}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "upcoming"
                ? "gradient-primary text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setTab("past")}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "past"
                ? "gradient-primary text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            History
          </button>
        </div>

        {/* Bookings Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 glass rounded-3xl border-dashed border-2">
            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-6">
              <CalendarX className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-bold mb-3">
              No {tab === "upcoming" ? "upcoming appointments" : "past bookings"}
            </h3>
            <p className="text-muted-foreground text-base max-w-sm mx-auto mb-8">
              {tab === "upcoming"
                ? "You don't have any scheduled appointments. Explore diagnostic centers near you to book one."
                : "Your completed or cancelled appointments will be listed here for your records."}
            </p>
            {tab === "upcoming" && (
              <button
                onClick={() => router.push("/user/dashboard")}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
              >
                Find a Center
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((booking) => {
              const statusInfo = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
              const slotDate = new Date(booking.slotTime);
              const isToday = slotDate.toDateString() === new Date().toDateString();
              const isTrackable = ["PENDING", "CONFIRMED", "IN_QUEUE", "IN_PROGRESS"].includes(booking.status);
              const isActive = isTrackable && isToday;

              return (
                <div
                  key={booking.id}
                  className={`group glass rounded-3xl p-6 card-hover flex flex-col border-white/40 ${
                    isActive ? "ring-2 ring-primary/20 bg-primary/5" : ""
                  }`}
                >
                  {/* Status & Date */}
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold shadow-sm ${statusInfo.class}`}
                    >
                      {statusInfo.label}
                    </span>
                    <p className="text-xs font-bold text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                      {slotDate.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                      <Hash className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-primary mb-0.5">TOKEN #{booking.tokenNumber}</p>
                      <h3 className="font-bold text-lg text-foreground line-clamp-1">
                        {booking.center?.centerName}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" /> {booking.service?.name}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-white/50 border border-white/20">
                      <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Patient</p>
                      <p className="text-sm font-semibold truncate">{booking.patientName}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/50 border border-white/20">
                      <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Time Slot</p>
                      <p className="text-sm font-semibold">
                        {slotDate.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border/50">
                    {isActive ? (
                      <Link
                        href={`/user/queue-status/${booking.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
                      >
                        <Eye className="w-4 h-4" />
                        Track Live Queue
                      </Link>
                    ) : isTrackable ? (
                      <div className="flex-1 text-center py-2.5 px-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs font-semibold text-primary">
                        Upcoming Appointment
                      </div>
                    ) : (
                      <div className="flex-1 text-center py-2.5 px-4 rounded-2xl bg-secondary/30 text-xs font-medium text-muted-foreground">
                        {booking.status === "DONE"
                          ? "Completed Successfully"
                          : booking.status === "CANCELLED"
                          ? "Cancelled"
                          : booking.status === "MISSED"
                          ? "Slot Missed"
                          : "Booking Closed"}
                      </div>
                    )}
                    {["PENDING", "CONFIRMED"].includes(booking.status) && (
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        disabled={!!cancelling}
                        className="px-4 py-3 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      >
                        {cancelling === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
