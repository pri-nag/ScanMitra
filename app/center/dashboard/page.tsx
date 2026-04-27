"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/shared/Navbar";
import { getSocketClient } from "@/lib/socket-client";
import {
  Users, Play, CheckCircle, Hash, AlertTriangle, Loader2, RefreshCw,
  UserPlus, Stethoscope, X
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import QueueTable from "@/components/center/QueueTable";
import DelayModal from "@/components/center/DelayModal";
import WalkInPopup from "@/components/center/WalkInPopup";

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

  const { data: session, status } = useSession();
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
  const [activeTab, setActiveTab] = useState<"queue" | "slots">("queue");
  const [slotData, setSlotData] = useState<any[]>([]);
  const [selectedSlotForWalkin, setSelectedSlotForWalkin] = useState<string | null>(null);

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

  const fetchSlots = useCallback(async (centerId: string, serviceId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await axios.get(`/api/slots?centerId=${centerId}&serviceId=${serviceId}&date=${today}`);
      setSlotData(res.data.slots || []);
    } catch {
      console.error("Failed to fetch slots");
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role !== "CENTER") {
        toast.error("Please log in as a center account.");
        router.push("/login");
        return;
      }
      setLoading(true);
      fetchCenter().then((c) => {
        if (c) {
          fetchQueue(c.id);
          // Initial slots fetch for the first service
          if (c.services?.[0]) fetchSlots(c.id, c.services[0].id);
        }
        setLoading(false);
      });
    }
  }, [status, session?.user?.role, fetchCenter, fetchQueue, router, fetchSlots]);

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
    const onQueueDelay = () => fetchQueue(center.id);
    const onNewBooking = (payload: any) => {
      toast.success(`New booking: ${payload.patientName} (#${payload.tokenNumber})`);
      fetchQueue(center.id);
    };

    socket.on("queue_update", onQueueUpdate);
    socket.on("queue_delay", onQueueDelay);
    socket.on("new_booking", onNewBooking);

    return () => {
      socket.off("queue_update", onQueueUpdate);
      socket.off("queue_delay", onQueueDelay);
      socket.off("new_booking", onNewBooking);
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
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Failed to broadcast delay";
      toast.error(message);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login");
      }
    }
  };

  const handleWalkin = async (slotTime?: string) => {
    if (!walkinForm.patientName || !walkinForm.mobile || !walkinForm.serviceId) {
      toast.error("Fill all fields");
      return;
    }
    
    setActionLoading("walkin");
    try {
      let finalSlotTime = new Date().toISOString();
      if (slotTime) {
        const today = new Date().toISOString().split("T")[0];
        finalSlotTime = new Date(`${today}T${slotTime}:00`).toISOString();
      }

      const payload = {
        ...walkinForm,
        centerId: center?.id,
        slotTime: finalSlotTime,
        patientPhone: walkinForm.mobile, // Sync field names
      };

      const res = await axios.post("/api/bookings/walkin", payload);
      
      if (res.data.warning) {
        toast(res.data.warning, { icon: "⚠️", duration: 5000 });
      }
      
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
            <div className="flex items-center gap-4 mt-2">
              <button 
                onClick={() => setActiveTab("queue")}
                className={`text-sm font-bold pb-1 border-b-2 transition-all ${activeTab === "queue" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
              >
                Live Queue
              </button>
              <button 
                onClick={() => {
                  setActiveTab("slots");
                  if (center && services[0]) fetchSlots(center.id, services[0].id);
                }}
                className={`text-sm font-bold pb-1 border-b-2 transition-all ${activeTab === "slots" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
              >
                Time Slots
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDelay(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Mark Delay
            </button>
            <button
              onClick={() => {
                setSelectedSlotForWalkin(null);
                setShowWalkin(true);
              }}
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

        {activeTab === "queue" ? (
          <>
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
            <QueueTable
              entries={waiting}
              onCall={handleCall}
              onSkip={handleSkip}
              actionLoading={actionLoading}
              inProgressId={inProgress?.id}
              onRefresh={() => center && fetchQueue(center.id)}
            />
          </>
        ) : (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Daily Slots Capacity</h2>
              <select 
                className="bg-secondary/50 border border-border rounded-lg text-xs px-3 py-1.5 focus:outline-none"
                value={walkinForm.serviceId}
                onChange={(e) => {
                  setWalkinForm({ ...walkinForm, serviceId: e.target.value });
                  if (center) fetchSlots(center.id, e.target.value);
                }}
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slotData.map((slot) => (
                <div key={slot.time} className="p-4 rounded-xl border border-border bg-secondary/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold">{slot.time}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        slot.status === "available" ? "bg-green-500/10 text-green-500" :
                        slot.status === "walkin_only" ? "bg-orange-500/10 text-orange-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        {slot.status.replace("_", " ")}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Online</span>
                        <span className="font-medium">{slot.onlineBooked} / {slot.onlineCapacity}</span>
                      </div>
                      <div className="w-full bg-secondary/50 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all" 
                          style={{ width: `${Math.min(100, (slot.onlineBooked / slot.onlineCapacity) * 100)}%` }} 
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Walk-in</span>
                        <span className="font-medium">{slot.walkInBooked} / {slot.walkInCapacity}</span>
                      </div>
                      <div className="w-full bg-secondary/50 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full transition-all" 
                          style={{ width: `${Math.min(100, (slot.walkInBooked / slot.walkInCapacity) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={slot.status === "full"}
                    onClick={() => {
                      setSelectedSlotForWalkin(slot.time);
                      setShowWalkin(true);
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                      slot.status === "full" 
                        ? "bg-secondary text-muted-foreground/40 cursor-not-allowed" 
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    Add Walk-in
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-refresh notice */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Real-time updates active via WebSocket
        </p>
      </div>

      {/* Walk-In Modal */}
      <WalkInPopup
        isOpen={showWalkin}
        onClose={() => setShowWalkin(false)}
        onAdd={handleWalkin}
        form={walkinForm}
        onFormChange={setWalkinForm}
        services={services}
        loading={actionLoading === "walkin"}
        selectedSlot={selectedSlotForWalkin}
      />

      {/* Delay Modal */}
      <DelayModal
        isOpen={showDelay}
        onClose={() => setShowDelay(false)}
        onBroadcast={handleDelay}
        currentDelay={delayMins}
        onDelayChange={setDelayMins}
      />
    </div>
  );
}
