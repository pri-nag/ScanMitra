"use client";

import { Stethoscope, Clock, IndianRupee, Pencil, Trash2, Loader2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  status: boolean;
  totalSlots: number;
}

interface ServiceTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  onAddFirst: () => void;
}

export default function ServiceTable({
  services,
  onEdit,
  onDelete,
  deletingId,
  onAddFirst,
}: ServiceTableProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-2xl">
        <Stethoscope className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Services Yet</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Add your first diagnostic service to start receiving bookings
        </p>
        <button
          onClick={onAddFirst}
          className="gradient-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-blue-500/25 transition-all"
        >
          Add Your First Service
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {services.map((service) => (
        <div key={service.id} className="glass rounded-2xl p-6 card-hover group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{service.name}</h3>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                    service.status
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {service.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {service.duration} min
            </span>
            <span className="flex items-center gap-1 font-semibold text-primary">
              <IndianRupee className="w-3.5 h-3.5" /> {service.price.toLocaleString()}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
              {service.totalSlots || 10} Slots
            </span>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-border/50">
            <button
              onClick={() => onEdit(service)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => onDelete(service.id)}
              disabled={deletingId === service.id}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
            >
              {deletingId === service.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
