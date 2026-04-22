"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/shared/Navbar";
import { getSocketClient } from "@/lib/socket-client";
import {
  Users, Play, CheckCircle, SkipForward,
  Hash, AlertTriangle, Loader2, RefreshCw,
  UserPlus, Stethoscope
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const QueueTable = dynamic(() => import("@/components/center/QueueTable"));

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-500/15",
  CONFIRMED: "text-blue-400 bg-blue-500/15",
  IN_QUEUE: "text-cyan-400 bg-cyan-500/15",
  IN_PROGRESS: "text-purple-400 bg-purple-500/15",
};

export default function CenterDashboardPage() {
  type Service = { id: string; name: string; price: number };
  type Center = { id: string; userId: string; centerName: string; services: Service[] };
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

  const { status } = useSession();
  const router = useRouter();
  const [center, setCenter] = useState<Center | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showWalkin, setShowWalkin] = useState(false);
  const [showDelay, setShowDelay] = useState(false);
  const [delayMins, setDelayMins] = useState(15);
  const [walkinForm, setWalkinForm] = useState({
    patientName: "",
    email: "",
    mobile: "",
    serviceId: "",
  });
  const [services, setServices] = useState<Service[]>([]);

  const patchEntryStatus = useCallback((entryId: string, status: string) => {
    setQueue((prev) =>
      prev.map((entry) => (entry.id === entryId ? { ...entry, status } : entry))
    );
  }, []);

  const removeEntry = useCallback((entryId: string) => {
    setQueue((prev) => prev.filter((entry) => entry.id !== entryId));
  }, []);

  const fetchCenter = useCallback(async () => {
    try {
      const res = await axios.get("/api/centers?mine=1");
      const myCenter = res.data.center as Center | null;
      if (!myCenter) {
        router.push("/center/profile/setup");
        return;
      }
      setCenter(myCenter);
      setServices(myCenter.services || []);
      return myCenter;
    } catch {
      return null;
    }
  }, [router]);

  const fetchQueue = useCallback(async (centerId: string) => {
    try {
      const res = await axios.get(`/api/queue/${centerId}`);
      setQueue(res.data.queue);
      setCompletedToday(res.data.completedToday);
    } catch {
      console.error("Failed to fetch queue");
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      fetchCenter().then((c) => {
        if (c) fetchQueue(c.id);
        setLoading(false);
      });
    }
  }, [status, fetchCenter, fetchQueue]);

  // Auto-refresh every 20 seconds (socket handles realtime updates)
  useEffect(() => {
    if (!center?.id) return;
    const interval = setInterval(() => fetchQueue(center.id), 20000);
    return () => clearInterval(interval);
  }, [center?.id, fetchQueue]);

  useEffect(() => {
    if (!center?.id) return;
    const socket = getSocketClient();
    if (!socket) return;

    socket.emit("join_center_room", { centerId: center.id });

    const onQueueUpdate = () => fetchQueue(center.id);
    const onDelayBroadcast = () => fetchQueue(center.id);
    socket.on("queue_update", onQueueUpdate);
    socket.on("delay_broadcast", onDelayBroadcast);

    return () => {
      socket.off("queue_update", onQueueUpdate);
      socket.off("delay_broadcast", onDelayBroadcast);
    };
  }, [center?.id, fetchQueue]);

  const handleCall = async (entryId: string) => {
    setActionLoading(entryId);
    const prevQueue = queue;
    patchEntryStatus(entryId, "IN_PROGRESS");
    try {
      await axios.patch(`/api/queue/call/${entryId}`);
      toast.success("Patient called");
      if (center) fetchQueue(center.id);
    } catch {
      setQueue(prevQueue);
      toast.error("Failed to call patient");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (entryId: string) => {
    setActionLoading(entryId);
    const prevQueue = queue;
    removeEntry(entryId);
    try {
      await axios.patch(`/api/queue/complete/${entryId}`);
      toast.success("Patient completed, next promoted");
      if (center) fetchQueue(center.id);
    } catch {
      setQueue(prevQueue);
      toast.error("Failed to complete");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (entryId: string) => {
    setActionLoading(entryId);
    const prevQueue = queue;
    removeEntry(entryId);
    try {
      await axios.patch(`/api/queue/skip/${entryId}`);
      toast.success("Patient marked as no-show");
      if (center) fetchQueue(center.id);
    } catch {
      setQueue(prevQueue);
      toast.error("Failed to skip");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelay = async () => {
    try {
      await axios.patch("/api/queue/delay", { delayMins });
      toast.success(`Delay of ${delayMins} min broadcasted`);
      setShowDelay(false);
      if (center) fetchQueue(center.id);
    } catch {
      toast.error("Failed to broadcast delay");
    }
  };

  const handleWalkin = async () => {
    if (!walkinForm.patientName || !walkinForm.email || !walkinForm.mobile || !walkinForm.serviceId) {
      toast.error("Fill all fields");
      return;
    }
    setActionLoading("walkin");
    try {
      const res = await axios.post("/api/queue/walkin", walkinForm);
      toast.success(`Walk-in added! Token #${res.data.booking.tokenNumber}`);
      setShowWalkin(false);
      setWalkinForm({ patientName: "", email: "", mobile: "", serviceId: "" });
      if (center) fetchQueue(center.id);
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Failed to add walk-in";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const inProgress = queue.find((e) => e.status === "IN_PROGRESS");
  const waiting = queue.filter((e) => ["IN_QUEUE", "CONFIRMED", "PENDING"].includes(e.status));

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">{center?.centerName}</h1>
            <p className="text-muted-foreground text-sm">Queue Management Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDelay(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Mark Delay
            </button>
            <button
              onClick={() => setShowWalkin(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium gradient-primary text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25"
            >
              <UserPlus className="w-4 h-4" /> Walk-In
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{waiting.length}</p>
            <p className="text-xs text-muted-foreground">In Queue</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Play className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{inProgress ? 1 : 0}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{completedToday}</p>
            <p className="text-xs text-muted-foreground">Done Today</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Hash className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{queue.length + completedToday}</p>
            <p className="text-xs text-muted-foreground">Total Today</p>
          </div>
        </div>

        {/* Currently In Progress */}
        {inProgress && (
          <div className="glass rounded-2xl p-6 mb-6 border border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-purple-400 font-medium mb-0.5">NOW SERVING</p>
                  <p className="font-semibold text-lg">{inProgress.booking.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    Token #{inProgress.booking.tokenNumber} · {inProgress.booking.service?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleComplete(inProgress.id)}
                disabled={actionLoading === inProgress.id}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
              >
                {actionLoading === inProgress.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Mark Done
              </button>
            </div>
          </div>
        )}

        {/* Queue Table */}
        <QueueTable>
        <div className="overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Queue ({waiting.length})
            </h2>
            <button
              onClick={() => center && fetchQueue(center.id)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {waiting.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No patients in queue</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 text-xs text-muted-foreground">
                    <th className="px-6 py-3 text-left font-medium">#</th>
                    <th className="px-6 py-3 text-left font-medium">Patient</th>
                    <th className="px-6 py-3 text-left font-medium">Service</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-left font-medium">Walk-In</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {waiting.map((entry) => {
                    const statusStyle = STATUS_COLORS[entry.status] || "";
                    return (
                      <tr key={entry.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary">#{entry.booking.tokenNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-sm">{entry.booking.patientName}</p>
                          <p className="text-xs text-muted-foreground">{entry.booking.patientPhone}</p>
                        </td>
                        <td className="px-6 py-4 text-sm">{entry.booking.service?.name}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-md font-medium ${statusStyle}`}>
                            {entry.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {entry.isWalkIn && (
                            <span className="text-xs px-2 py-1 rounded-md bg-violet-500/15 text-violet-400 font-medium">
                              Walk-In
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCall(entry.id)}
                              disabled={!!actionLoading || !!inProgress}
                              title={inProgress ? "Complete current patient first" : "Call this patient"}
                              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {actionLoading === entry.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleSkip(entry.id)}
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
        </QueueTable>

        {/* Auto-refresh notice */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Auto-refreshes every 10 seconds
        </p>
      </div>

      {/* Walk-In Modal */}
      {showWalkin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 sm:p-8 w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Add Walk-In Patient
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Patient Name *</label>
                <input
                  value={walkinForm.patientName}
                  onChange={(e) => setWalkinForm({ ...walkinForm, patientName: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  value={walkinForm.email}
                  onChange={(e) => setWalkinForm({ ...walkinForm, email: e.target.value })}
                  placeholder="patient@gmail.com"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mobile *</label>
                <input
                  value={walkinForm.mobile}
                  onChange={(e) => setWalkinForm({ ...walkinForm, mobile: e.target.value })}
                  placeholder="10-digit number"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Service *</label>
                <select
                  value={walkinForm.serviceId}
                  onChange={(e) => setWalkinForm({ ...walkinForm, serviceId: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — ₹{s.price}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWalkin(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium border border-border hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWalkin}
                disabled={actionLoading === "walkin"}
                className="flex-1 gradient-primary text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-blue-500/25"
              >
                {actionLoading === "walkin" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Queue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delay Modal */}
      {showDelay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 sm:p-8 w-full max-w-sm animate-fade-in">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" /> Broadcast Delay
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will add delay to all patients currently in queue.
            </p>
            <div className="flex items-center gap-3 mb-6">
              {[10, 15, 20, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setDelayMins(m)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    delayMins === m
                      ? "gradient-primary text-white shadow-lg"
                      : "bg-secondary/50 text-muted-foreground border border-border"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelay(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium border border-border hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelay}
                className="flex-1 bg-orange-500/20 text-orange-400 py-3 rounded-xl text-sm font-medium hover:bg-orange-500/30 transition-colors"
              >
                Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
