"use client";

export default function SlotGrid({
  slots,
  selected,
  onSelect,
}: {
  slots: { time: string; available: boolean }[];
  selected?: string;
  onSelect: (time: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.time}
          disabled={!slot.available}
          onClick={() => onSelect(slot.time)}
          className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
            selected === slot.time
              ? "bg-primary text-primary-foreground border-primary"
              : slot.available
                ? "border-border hover:bg-secondary/50"
                : "bg-destructive/10 text-destructive border-destructive/20 cursor-not-allowed"
          }`}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
}
