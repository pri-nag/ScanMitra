"use client";

import { UserPlus, Loader2, X } from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
}

interface WalkInForm {
  patientName: string;
  email: string;
  mobile: string;
  serviceId: string;
}

interface WalkInPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (slot?: string) => void;
  form: WalkInForm;
  onFormChange: (form: WalkInForm) => void;
  services: Service[];
  loading: boolean;
  selectedSlot?: string | null;
}

export default function WalkInPopup({
  isOpen,
  onClose,
  onAdd,
  form,
  onFormChange,
  services,
  loading,
  selectedSlot,
}: WalkInPopupProps) {
  if (!isOpen) return null;

  const handleChange = (field: keyof WalkInForm, value: string) => {
    onFormChange({ ...form, [field]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass rounded-2xl p-6 sm:p-8 w-full max-w-md animate-fade-in relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" /> Add Walk-In Patient
        </h3>
        {selectedSlot && (
          <p className="text-xs font-semibold text-primary mb-6 bg-primary/10 w-fit px-3 py-1 rounded-lg border border-primary/20">
            For Slot: {selectedSlot}
          </p>
        )}
        {!selectedSlot && <div className="mb-6" />}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Patient Name *</label>
            <input
              value={form.patientName}
              onChange={(e) => handleChange("patientName", e.target.value)}
              placeholder="Enter patient's full name"
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="patient@gmail.com"
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Mobile *</label>
            <input
              value={form.mobile}
              onChange={(e) => handleChange("mobile", e.target.value)}
              placeholder="10-digit number"
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Service *</label>
            <select
              value={form.serviceId}
              onChange={(e) => handleChange("serviceId", e.target.value)}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
            >
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ₹{s.price}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-border hover:bg-secondary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onAdd(selectedSlot || undefined)}
            disabled={loading}
            className="flex-1 gradient-primary text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-blue-500/25 transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Add to Queue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
