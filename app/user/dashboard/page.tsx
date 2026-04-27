"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import CenterCard from "@/components/user/CenterCard";
import { SCAN_TYPES } from "@/lib/validations";
import {
  Search, SlidersHorizontal, Building2,
  X
} from "lucide-react";
import axios from "axios";

type Center = {
  id: string;
  centerName: string;
  address: string;
  availableScans: string[];
  services: { id: string; name: string; price: number; duration: number }[];
  openingTime: string;
  closingTime: string;
  emergencySupport: boolean;
  _count: { bookings: number };
};

export default function UserDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [centers, setCenters] = useState<Center[]>([]);
  const [search, setSearch] = useState("");
  const [scanType, setScanType] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);

  // Check if user has profile
  useEffect(() => {
    if (status !== "authenticated") return;
    axios
      .get("/api/users")
      .then((res) => {
        if (!res.data.patient) {
          router.push("/user/profile/setup");
        } else {
          setProfileChecked(true);
        }
      })
      .catch(() => setProfileChecked(true));
  }, [status, router]);

  // Fetch centers
  useEffect(() => {
    if (!profileChecked) return;
    setLoading(true);
    axios
      .get("/api/centers")
      .then((res) => setCenters(res.data.centers || []))
      .catch(() => setCenters([]))
      .finally(() => setLoading(false));
  }, [profileChecked]);

  // Client-side filtering
  const filtered = useMemo(() => {
    return centers.filter((center) => {
      const s = search.toLowerCase();
      const matchesSearch =
        !s ||
        center.centerName.toLowerCase().includes(s) ||
        center.address.toLowerCase().includes(s);
      const matchesScan = !scanType || center.availableScans.includes(scanType);
      return matchesSearch && matchesScan;
    });
  }, [centers, search, scanType]);

  if (status === "loading" || !profileChecked) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Navbar />
      
      {/* Hero / Search Section */}
      <div className="relative overflow-hidden pt-24 pb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background -z-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
              Find Your Diagnostic Center
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Real-time queue tracking for ultrasound, X-ray, and more. 
              Book instantly, skip the waiting room.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="glass rounded-3xl p-5 shadow-xl shadow-primary/5 border-primary/10">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 items-center">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search center name, city or locality..."
                  className="w-full pl-12 pr-4 py-4 bg-secondary/40 border border-border/50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="relative">
                <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  className="pl-11 pr-10 py-4 bg-secondary/40 border border-border/50 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none min-w-[200px]"
                >
                  <option value="">All Scan Types</option>
                  {SCAN_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-muted-foreground" />
                </div>
              </div>
              {(search || scanType) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setScanType("");
                  }}
                  className="px-6 py-4 text-sm font-semibold text-primary hover:bg-primary/5 rounded-2xl transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Results Info */}
        {!loading && (
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Available Centers
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                {filtered.length}
              </span>
            </h2>
            {(search || scanType) && (
              <p className="text-sm text-muted-foreground">
                Showing results for {search && `"${search}"`} {scanType && `[${scanType}]`}
              </p>
            )}
          </div>
        )}

        {/* Centers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-6 h-[220px]">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl skeleton flex-shrink-0" />
                  <div className="flex-1 pt-1">
                    <div className="h-5 skeleton rounded-lg w-3/4 mb-3" />
                    <div className="h-3 skeleton rounded-lg w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-3 skeleton rounded-lg w-full" />
                  <div className="h-3 skeleton rounded-lg w-2/3" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="w-20 h-4 skeleton rounded-lg" />
                  <div className="w-24 h-8 skeleton rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 glass rounded-3xl border-dashed border-2">
            <Building2 className="w-20 h-20 text-muted-foreground/20 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-3">No Centers Found</h3>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              {search || scanType
                ? "We couldn't find any centers matching your filters. Try clearing them to see all options."
                : "No diagnostic centers are registered in our network yet. Please check back later."}
            </p>
            {(search || scanType) && (
              <button
                onClick={() => {
                  setSearch("");
                  setScanType("");
                }}
                className="mt-8 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
              >
                Show All Centers
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((center) => (
              <CenterCard key={center.id} center={center} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
