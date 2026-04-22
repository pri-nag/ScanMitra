"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import Navbar from "@/components/shared/Navbar";
import SlotGrid from "@/components/user/SlotGrid";
import BookingModal from "@/components/user/BookingModal";

const CenterMap = dynamic(() => import("@/components/user/CenterMap"), { ssr: false });

export default function CenterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  type Service = { id: string; name: string; price: number; duration: number };
  type Center = { centerName: string; address: string; services: Service[] };
  const [center, setCenter] = useState<Center | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/centers/${id}`).then((res) => {
      setCenter(res.data.center);
      setSlots(res.data.slots || []);
      if (res.data.center?.services?.[0]?.id) setServiceId(res.data.center.services[0].id);
    });
  }, [id]);

  useEffect(() => {
    if (!id || !serviceId) return;
    axios.get(`/api/centers/${id}?serviceId=${serviceId}`).then((res) => setSlots(res.data.slots || []));
  }, [id, serviceId]);

  const selectedService = useMemo(
    () => center?.services?.find((service) => service.id === serviceId),
    [center, serviceId]
  );

  const createBooking = async (payload: { patientName: string; patientPhone: string; additionalInfo?: string }) => {
    if (!selectedSlot) return toast.error("Select a slot first");
    await axios.post("/api/bookings", {
      centerId: id,
      serviceId,
      slotTime: new Date(`${new Date().toISOString().slice(0, 10)}T${selectedSlot}:00`).toISOString(),
      ...payload,
    });
    toast.success("Booking created");
    setOpenModal(false);
    router.push("/user/bookings");
  };

  if (!center) return <div className="min-h-screen"><Navbar /></div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold">{center.centerName}</h1>
        <p className="text-sm text-muted-foreground mt-1">{center.address}</p>

        <div className="mt-6">
          <label className="text-sm block mb-2">Choose service</label>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="px-3 py-2 rounded-lg bg-secondary/60 border border-border">
            {center.services?.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - Rs {service.price} ({service.duration}m)
              </option>
            ))}
          </select>
          {selectedService && <p className="text-xs text-muted-foreground mt-2">Duration: {selectedService.duration} minutes</p>}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Available Slots</h2>
          <SlotGrid slots={slots} selected={selectedSlot} onSelect={setSelectedSlot} />
        </div>

        <button onClick={() => setOpenModal(true)} className="mt-8 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium">
          Book Selected Slot
        </button>

        <CenterMap address={center.address} />
      </main>

      <BookingModal open={openModal} onClose={() => setOpenModal(false)} onSubmit={createBooking} />
    </div>
  );
}
