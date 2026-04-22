"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "@/components/shared/Navbar";
import BookingCard from "@/components/user/BookingCard";

export default function UserBookingsPage() {
  type Booking = {
    id: string;
    status: string;
    slotTime: string;
    tokenNumber: number;
    center?: { centerName?: string };
    service?: { name?: string };
  };
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const loadBookings = () => {
    axios.get("/api/bookings").then((res) => setBookings(res.data.bookings || []));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const isPast = ["DONE", "CANCELLED", "NO_SHOW"].includes(booking.status);
      return tab === "past" ? isPast : !isPast;
    });
  }, [bookings, tab]);

  const cancelBooking = async (id: string) => {
    await axios.patch(`/api/bookings/${id}`, { action: "cancel" });
    toast.success("Booking cancelled");
    loadBookings();
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-24 pb-14">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <div className="mt-5 inline-flex rounded-xl border border-border p-1">
          <button onClick={() => setTab("upcoming")} className={`px-4 py-2 rounded-lg text-sm ${tab === "upcoming" ? "bg-primary text-primary-foreground" : ""}`}>Upcoming</button>
          <button onClick={() => setTab("past")} className={`px-4 py-2 rounded-lg text-sm ${tab === "past" ? "bg-primary text-primary-foreground" : ""}`}>Past</button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onCancel={cancelBooking} />
          ))}
        </div>
      </main>
    </div>
  );
}
