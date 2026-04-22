"use client";

import { useState } from "react";

export default function BookingModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { patientName: string; patientPhone: string; additionalInfo?: string }) => void;
}) {
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Confirm Booking</h3>
        <div className="space-y-3">
          <input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Patient Name" className="w-full px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="10-digit phone" className="w-full px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="Additional info (optional)" className="w-full px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-border">Cancel</button>
          <button
            onClick={() => onSubmit({ patientName, patientPhone, additionalInfo })}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}
