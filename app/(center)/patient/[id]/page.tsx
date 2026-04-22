"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import {
  ArrowLeft, User, Phone, MapPin, Heart, Calendar,
  AlertCircle, FileText, Stethoscope, Upload
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function PatientViewPage() {
  const { id } = useParams<{ id: string }>(); // bookingId
  const router = useRouter();
  const [booking, setBooking] = useState<{
    id: string;
    patientName: string;
    tokenNumber: number;
    patientPhone: string;
    slotTime: string;
    additionalInfo?: string | null;
    service?: { name?: string };
    user?: { patientProfile?: Record<string, unknown> & {
      age?: number;
      sex?: string;
      bloodGroup?: string;
      mobile?: string;
      city?: string;
      state?: string;
      emergencyContact?: string;
      medicalHistory?: string;
    } };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingReport, setUploadingReport] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axios.get(`/api/queue/status/${id}`);
        setBooking(res.data.booking);
      } catch {
        toast.error("Failed to load patient info");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="text-center pt-32">
          <p className="text-muted-foreground">Patient not found</p>
        </div>
      </div>
    );
  }

  const patient = booking.user?.patientProfile;
  const reportLinks = (booking.additionalInfo || "")
    .split("\n")
    .filter((line) => line.startsWith("Report: "))
    .map((line) => line.replace("Report: ", "").trim())
    .filter(Boolean);

  const handleReportUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !booking) return;
    setUploadingReport(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "scanmitra/test-reports");
      const upload = await axios.post("/api/uploads/cloudinary", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const reportUrl = String(upload.data.secure_url || "");
      await axios.patch(`/api/bookings/${booking.id}`, {
        action: "upload_report",
        reportUrl,
      });
      toast.success("Report uploaded and attached");
      const refreshed = await axios.get(`/api/queue/status/${id}`);
      setBooking(refreshed.data.booking);
    } catch {
      toast.error("Failed to upload report");
    } finally {
      setUploadingReport(false);
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Patient Header */}
        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{booking.patientName}</h1>
              <p className="text-sm text-muted-foreground">
                Token #{booking.tokenNumber} · {booking.service?.name}
              </p>
            </div>
          </div>

          {/* Booking Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="glass-light rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="font-medium flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-primary" /> {booking.patientPhone}
              </p>
            </div>
            <div className="glass-light rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Slot Time</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {new Date(booking.slotTime).toLocaleTimeString("en-IN", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {booking.additionalInfo && (
            <div className="mt-4 p-4 bg-secondary/30 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Additional Info
              </p>
              <p className="text-sm">{booking.additionalInfo}</p>
            </div>
          )}
        </div>

        {/* Patient Profile */}
        {patient ? (
          <div className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" /> Patient Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {patient.age && (
                <div>
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="font-medium">{patient.age} years</p>
                </div>
              )}
              {patient.sex && (
                <div>
                  <p className="text-xs text-muted-foreground">Sex</p>
                  <p className="font-medium">{patient.sex}</p>
                </div>
              )}
              {patient.bloodGroup && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Blood Group
                  </p>
                  <p className="font-medium text-red-400">{patient.bloodGroup}</p>
                </div>
              )}
              {patient.mobile && (
                <div>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="font-medium">{patient.mobile}</p>
                </div>
              )}
              {patient.city && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> City
                  </p>
                  <p className="font-medium">{patient.city}{patient.state ? `, ${patient.state}` : ""}</p>
                </div>
              )}
              {patient.emergencyContact && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Emergency Contact
                  </p>
                  <p className="font-medium">{patient.emergencyContact}</p>
                </div>
              )}
            </div>

            {patient.medicalHistory && (
              <div className="mt-4 p-4 bg-secondary/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Medical History</p>
                <p className="text-sm">{patient.medicalHistory}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No detailed profile available for this patient
            </p>
          </div>
        )}

        <div className="glass rounded-2xl p-6 sm:p-8 mt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> Test Report Upload
          </h2>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleReportUpload}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm"
          />
          {uploadingReport && (
            <p className="text-xs text-muted-foreground mt-2">Uploading report...</p>
          )}
          {reportLinks.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">Uploaded Reports</p>
              {reportLinks.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-primary hover:underline break-all"
                >
                  {url}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
