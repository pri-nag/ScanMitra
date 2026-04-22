"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/shared/Navbar";
import CenterCard from "@/components/user/CenterCard";
import { SCAN_TYPES } from "@/lib/validations";
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
  const [centers, setCenters] = useState<Center[]>([]);
  const [search, setSearch] = useState("");
  const [scanType, setScanType] = useState("");

  useEffect(() => {
    axios
      .get("/api/centers")
      .then((res) => setCenters(res.data.centers || []))
      .catch(() => setCenters([]));
  }, []);

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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-14">
        <h1 className="text-3xl font-bold">Find Diagnostic Centers</h1>
        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by center name or city"
            className="sm:col-span-2 px-4 py-3 bg-secondary/50 border border-border rounded-xl"
          />
          <select value={scanType} onChange={(e) => setScanType(e.target.value)} className="px-4 py-3 bg-secondary/50 border border-border rounded-xl">
            <option value="">All scan types</option>
            {SCAN_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
          {filtered.map((center) => (
            <CenterCard key={center.id} center={center} />
          ))}
        </div>
      </main>
    </div>
  );
}
