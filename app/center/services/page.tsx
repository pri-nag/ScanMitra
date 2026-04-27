"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/shared/Navbar";
import {
  Plus, Loader2, X, Save, ToggleLeft, ToggleRight
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import ServiceTable from "@/components/center/ServiceTable";

export default function ServicesPage() {
  type Service = { id: string; name: string; duration: number; price: number; status: boolean; totalSlots: number };
  const { status } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", duration: 15, price: 0, status: true, totalSlots: 10 });

  const fetchServices = async () => {
    try {
      const res = await axios.get("/api/services");
      setServices(res.data.services);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchServices();
  }, [status]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", duration: 15, price: 0, status: true, totalSlots: 10 });
    setShowModal(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      name: service.name,
      duration: service.duration,
      price: service.price,
      status: service.status,
      totalSlots: service.totalSlots || 10,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || form.duration < 1) {
      toast.error("Fill in required fields");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`/api/services/${editing.id}`, form);
        toast.success("Service updated");
      } else {
        await axios.post("/api/services", form);
        toast.success("Service added");
      }
      setShowModal(false);
      fetchServices();
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Failed to save";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/services/${id}`);
      toast.success("Service deleted");
      fetchServices();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  if (status === "loading" || loading) {
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
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Services</h1>
            <p className="text-muted-foreground text-sm">Manage your diagnostic services and pricing</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium gradient-primary text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>

        <ServiceTable
          services={services}
          onEdit={openEdit}
          onDelete={handleDelete}
          deletingId={deleting}
          onAddFirst={openAdd}
        />
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 sm:p-8 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                {editing ? "Edit Service" : "Add New Service"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. CT Scan Full Body"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (min) *</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Total Daily Slots *</label>
                <input
                  type="number"
                  value={form.totalSlots}
                  onChange={(e) => setForm({ ...form, totalSlots: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1 px-1">
                  Total patients allowed across all time slots per day. (80% online / 20% walk-in)
                </p>
              </div>
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: !form.status })}
                  className="text-primary"
                >
                  {form.status ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                </button>
                <span className="text-sm font-medium">
                  {form.status ? "Active — visible to patients" : "Inactive — hidden from patients"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium border border-border hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 gradient-primary text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-blue-500/25"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
