"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/shared/Navbar";
import {
  Building2, MapPin, Clock, Stethoscope, IndianRupee,
  Calendar, ArrowLeft, CheckCircle, Loader2, AlertCircle,
  Shield, X
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { getSocketClient } from "@/lib/socket-client";

type Service = { id: string; name: string; price: number; duration: number; status: boolean };
type Center = {
  id: string;
  centerName: string;
  address: string;
  openingTime: string;
  closingTime: string;
  availableScans: string[];
  emergencySupport: boolean;
  phone1: string;
  services: Service[];
};
type Slot = { 
  time: string; 
  available: boolean; 
  status: "available" | "walkin_only" | "full";
  onlineCapacity: number;
  walkInCapacity: number;
  onlineBooked: number;
  walkInBooked: number;
};

export default function CenterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [center, setCenter] = useState<Center | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    patientName: "",
    patientPhone: "",
    additionalInfo: "",
  });

  // Fetch center details
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios
      .get(`/api/centers/${id}`)
      .then((res) => {
        setCenter(res.data.center);
        setSlots(res.data.slots || []);
        const firstService = res.data.center?.services?.[0];
        if (firstService) setServiceId(firstService.id);
      })
      .catch(() => toast.error("Failed to load center"))
      .finally(() => setLoading(false));
  }, [id]);

  // Refresh slots when service or date changes
  const fetchSlots = useCallback(() => {
    if (!id || !serviceId) return;
    axios
      .get(`/api/slots?centerId=${id}&serviceId=${serviceId}&date=${selectedDate}`)
      .then((res) => setSlots(res.data.slots || []))
      .catch(() => {});
  }, [id, serviceId, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Real-time slot updates
  useEffect(() => {
    if (!id) return;
    const socket = getSocketClient();
    if (!socket) return;

    socket.emit("join_center_room", { centerId: id });
    socket.on("slot_updated", fetchSlots);

    return () => {
      socket.off("slot_updated", fetchSlots);
    };
  }, [id, fetchSlots]);

  const selectedService = useMemo(
    () => center?.services?.find((s) => s.id === serviceId),
    [center, serviceId]
  );

  const availableSlots = useMemo(
    () => slots.filter((s) => s.available),
    [slots]
  );

  const handleBook = async () => {
    if (!selectedSlot) return toast.error("Please select a time slot");
    if (!bookingForm.patientName.trim()) return toast.error("Patient name is required");
    if (!bookingForm.patientPhone.trim()) return toast.error("Phone number is required");

    setBooking(true);
    try {
      await axios.post("/api/bookings", {
        centerId: id,
        serviceId,
        slotTime: new Date(`${selectedDate}T${selectedSlot}:00`).toISOString(),
        patientName: bookingForm.patientName,
        patientPhone: bookingForm.patientPhone,
        additionalInfo: bookingForm.additionalInfo,
      });
      toast.success("Booking confirmed!");
      setShowBookingModal(false);
      router.push("/user/bookings");
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Failed to book";
      toast.error(message);
    } finally {
      setBooking(false);
    }
  };

  // Pre-fill patient info
  useEffect(() => {
    if (authStatus === "authenticated" && !bookingForm.patientName) {
      axios
        .get("/api/users")
        .then((res) => {
          const p = res.data.patient;
          if (p) {
            setBookingForm((prev) => ({
              ...prev,
              patientName: prev.patientName || p.name || "",
              patientPhone: prev.patientPhone || p.mobile || "",
            }));
          }
        })
        .catch(() => {});
    }
  }, [authStatus, bookingForm.patientName]);

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

  if (!center) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="text-center pt-32">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Center not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Center Header */}
            <div className="glass rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">{center.centerName}</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {center.address}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {center.openingTime} - {center.closingTime}
                </span>
                {center.emergencySupport && (
                  <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 font-medium">
                    <Shield className="w-3.5 h-3.5" /> 24/7 Emergency
                  </span>
                )}
              </div>

              {/* Scan Types */}
              <div className="flex flex-wrap gap-2 mt-4">
                {center.availableScans.map((scan) => (
                  <span
                    key={scan}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium"
                  >
                    {scan}
                  </span>
                ))}
              </div>
            </div>

            {/* Service Selection */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" /> Select Service
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {center.services
                  .filter((s) => s.status)
                  .map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setServiceId(service.id);
                        setSelectedSlot("");
                      }}
                      className={`p-4 rounded-xl text-left transition-all border ${
                        serviceId === service.id
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                          : "border-border bg-secondary/20 hover:bg-secondary/40"
                      }`}
                    >
                      <p className="font-medium text-sm">{service.name}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {service.duration} min
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          <IndianRupee className="w-3 h-3" /> {service.price.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Date + Slot Selection */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Select Date & Slot
              </h2>
              <div className="mb-4">
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot("");
                  }}
                  className="px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {slots.length === 0 ? (
                <div className="text-center py-10">
                  <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No slots available for this date
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    {availableSlots.length} of {slots.length} slots available
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot === slot.time;
                      const isWalkinOnly = slot.status === "walkin_only";
                      const isFull = slot.status === "full";

                      return (
                        <div key={slot.time} className="relative group">
                          <button
                            disabled={isFull || isWalkinOnly}
                            onClick={() =>
                              setSelectedSlot(isSelected ? "" : slot.time)
                            }
                            title={isWalkinOnly ? "This slot is walk-in only" : ""}
                            className={`w-full py-2.5 px-2 rounded-lg text-xs font-medium transition-all relative ${
                              isSelected
                                ? "gradient-primary text-white shadow-lg shadow-blue-500/20"
                                : !isFull && !isWalkinOnly
                                ? "bg-secondary/50 text-foreground hover:bg-secondary border border-border"
                                : isWalkinOnly
                                ? "bg-orange-500/10 text-orange-500/50 border border-orange-500/20 cursor-help"
                                : "bg-secondary/20 text-muted-foreground/40 cursor-not-allowed line-through"
                            }`}
                          >
                            {slot.time}
                          </button>
                          {isWalkinOnly && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                          )}
                          {/* Tooltip for walk-in only */}
                          {isWalkinOnly && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Walk-in only
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Center</span>
                  <span className="font-medium text-right max-w-[60%] truncate">
                    {center.centerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">
                    {selectedService?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {selectedService?.duration || "—"} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short" }
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slot</span>
                  <span className="font-medium text-primary">
                    {selectedSlot || "Not selected"}
                  </span>
                </div>
                <hr className="border-border/50" />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary flex items-center gap-0.5">
                    <IndianRupee className="w-4 h-4" />
                    {selectedService?.price?.toLocaleString() || "—"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                disabled={!selectedSlot}
                className="w-full mt-6 gradient-primary text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
              >
                <CheckCircle className="w-4 h-4" />
                {selectedSlot ? "Confirm Booking" : "Select a Slot"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 sm:p-8 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Confirm Booking</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Patient Name *
                </label>
                <input
                  value={bookingForm.patientName}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      patientName: e.target.value,
                    })
                  }
                  placeholder="Full name"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number *
                </label>
                <input
                  value={bookingForm.patientPhone}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      patientPhone: e.target.value,
                    })
                  }
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Info
                </label>
                <textarea
                  value={bookingForm.additionalInfo}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      additionalInfo: e.target.value,
                    })
                  }
                  placeholder="Any special requirements or notes..."
                  rows={3}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium border border-border hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={booking}
                className="flex-1 gradient-primary text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-blue-500/25"
              >
                {booking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Book Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
