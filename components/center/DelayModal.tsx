"use client";

import { AlertTriangle, X } from "lucide-react";

interface DelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcast: (mins: number) => void;
  currentDelay: number;
  onDelayChange: (mins: number) => void;
}

export default function DelayModal({
  isOpen,
  onClose,
  onBroadcast,
  currentDelay,
  onDelayChange,
}: DelayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass rounded-2xl p-6 sm:p-8 w-full max-w-sm animate-fade-in relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" /> Broadcast Delay
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          This will add delay to all patients currently in queue.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {[10, 15, 20, 30, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => onDelayChange(m)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentDelay === m
                  ? "gradient-primary text-white shadow-lg shadow-blue-500/20"
                  : "bg-secondary/50 text-muted-foreground border border-border hover:bg-secondary"
              }`}
            >
              {m}m
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-border hover:bg-secondary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onBroadcast(currentDelay)}
            className="flex-1 bg-orange-500/20 text-orange-400 py-3 rounded-xl text-sm font-medium hover:bg-orange-500/30 transition-colors"
          >
            Broadcast
          </button>
        </div>
      </div>
    </div>
  );
}
