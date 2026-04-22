"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Navbar from "@/components/shared/Navbar";
import {
  Plus, Pencil, Trash2, Stethoscope, Clock,
  IndianRupee, Loader2, X, Save, ToggleLeft, ToggleRight
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const ServiceTable = dynamic(() => import("@/components/center/ServiceTable"));

export default function ServicesPage() {
  type Service = { id: string; name: string; duration: number; price: number; status: boolean };
  const { status } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", duration: 15, price: 0, status: true });

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
    setForm({ name: "", duration: 15, price: 0, status: true });
    setShowModal(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      name: service.name,
      duration: service.duration,
      price: service.price,
      status: service.status,
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

        <ServiceTable>
        {services.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <Stethoscope className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Services Yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Add your first diagnostic service to start receiving bookings
            </p>
            <button
              onClick={openAdd}
              className="gradient-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90"
            >
              Add Your First Service
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((service) => (
              <div key={service.id} className="glass rounded-2xl p-6 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                          service.status
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
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
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                  <button
                    onClick={() => openEdit(service)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    disabled={deleting === service.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  >
                    {deleting === service.id ? (
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
        )}
        </ServiceTable>
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
