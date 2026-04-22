"use client";

import { Building2, MapPin, Clock } from "lucide-react";
import Link from "next/link";

interface CenterCardProps {
  center: {
    id: string;
    centerName: string;
    address: string;
    openingTime: string;
    closingTime: string;
    availableScans: string[];
    emergencySupport: boolean;
    services: { id: string; name: string; price: number; duration: number }[];
    _count: { bookings: number };
  };
}

export default function CenterCard({ center }: CenterCardProps) {
  const minPrice = center.services.length
    ? Math.min(...center.services.map((s) => s.price))
    : null;

  return (
    <Link href={`/user/center/${center.id}`}>
      <div className="bg-white border border-border rounded-2xl p-6 card-hover group cursor-pointer h-full flex flex-col shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
                {center.centerName}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{center.address}</span>
              </p>
            </div>
          </div>
          {center.emergencySupport && (
            <span className="text-[10px] font-medium bg-red-500/15 text-red-400 px-2 py-1 rounded-md flex-shrink-0">
              24/7
            </span>
          )}
        </div>

        {/* Timing */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Clock className="w-3.5 h-3.5 text-primary" />
          {center.openingTime} — {center.closingTime}
        </div>

        {/* Scan Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4 flex-grow">
          {center.availableScans.slice(0, 4).map((scan) => (
            <span
              key={scan}
              className="text-[10px] px-2 py-1 rounded-md bg-secondary/70 text-muted-foreground"
            >
              {scan}
            </span>
          ))}
          {center.availableScans.length > 4 && (
            <span className="text-[10px] px-2 py-1 rounded-md bg-[#eef5f4] text-muted-foreground">
              +{center.availableScans.length - 4} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            {minPrice !== null && (
              <span className="text-sm font-semibold text-primary">
                ₹{minPrice.toLocaleString()}+
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {center._count.bookings} bookings
            </span>
          </div>
          <span className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium">
            Book Now
          </span>
        </div>
      </div>
    </Link>
  );
}
