"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Navbar from "@/components/shared/Navbar";
import QueueStatusCard from "@/components/user/QueueStatusCard";
import { getSocketClient } from "@/lib/socket-client";

type QueueStatusResponse = {
  booking: { id: string; centerId: string; status: string; tokenNumber: number };
  queuePosition: number;
  estimatedWait: number;
};

export default function QueueStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<QueueStatusResponse | null>(null);
  const [delayMessage, setDelayMessage] = useState("");

  const fetchStatus = useCallback(async () => {
    const res = await axios.get(`/api/queue/status/${id}`);
    setData(res.data);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchStatus();
  }, [id, fetchStatus]);

  useEffect(() => {
    if (!data?.booking) return;
    const socket = getSocketClient();
    if (!socket) return;
    socket.emit("join_queue_room", { bookingId: data.booking.id });
    socket.emit("join_center_room", { centerId: data.booking.centerId });
    socket.on("queue_update", fetchStatus);
    socket.on("delay_broadcast", (payload: { delayMins: number }) => {
      setDelayMessage(`Center announced a delay of ${payload.delayMins} minutes.`);
      fetchStatus();
    });
    return () => {
      socket.off("queue_update", fetchStatus);
      socket.off("delay_broadcast");
    };
  }, [data?.booking, fetchStatus]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        {delayMessage && <div className="mb-4 p-3 rounded-lg bg-orange-500/15 text-orange-300 text-sm">{delayMessage}</div>}
        {data?.booking && (
          <QueueStatusCard booking={data.booking} queuePosition={data.queuePosition} estimatedWait={data.estimatedWait} />
        )}
      </main>
    </div>
  );
}
