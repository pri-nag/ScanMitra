"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { centerProfileSchema, type CenterProfileInput, SCAN_TYPES } from "@/lib/validations";
import Navbar from "@/components/shared/Navbar";
import { Building2, Phone, MapPin, Clock, Shield, Save, Cpu, Upload } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function CenterProfileSetupPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [existingProfile, setExistingProfile] = useState(false);
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [identityProofUrl, setIdentityProofUrl] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CenterProfileInput>({
    resolver: zodResolver(centerProfileSchema),
    defaultValues: { emergencySupport: false, availableScans: [] },
  });

  useEffect(() => {
    if (status === "authenticated") {
      axios.get("/api/centers?mine=1").then((res) => {
        const myCenter = res.data.center;
        if (myCenter) {
          setExistingProfile(true);
          setSelectedScans(myCenter.availableScans || []);
          setIdentityProofUrl(myCenter.identityProofUrl || "");
          reset({
            centerName: myCenter.centerName,
            address: myCenter.address,
            phone1: myCenter.phone1,
            phone2: myCenter.phone2 || "",
            phone3: myCenter.phone3 || "",
            clinicLicenseNo: myCenter.clinicLicenseNo || "",
            radiologistRegId: myCenter.radiologistRegId || "",
            govHealthReg: myCenter.govHealthReg || "",
            identityProofUrl: myCenter.identityProofUrl || "",
            availableScans: myCenter.availableScans || [],
            machineBrand: myCenter.machineBrand || "",
            machineModel: myCenter.machineModel || "",
            machineYear: myCenter.machineYear || undefined,
            openingTime: myCenter.openingTime,
            closingTime: myCenter.closingTime,
            dailyPatientCapacity: myCenter.dailyPatientCapacity || undefined,
            emergencySupport: myCenter.emergencySupport || false,
          });
        }
      });
    }
  }, [status, reset]);

  const toggleScan = (scan: string) => {
    const updated = selectedScans.includes(scan)
      ? selectedScans.filter((s) => s !== scan)
      : [...selectedScans, scan];
    setSelectedScans(updated);
    setValue("availableScans", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: CenterProfileInput) => {
    setLoading(true);
    try {
      await axios.put("/api/centers", { ...data, identityProofUrl });
      toast.success("Center profile saved!");
      router.push("/center/dashboard");
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Failed to save";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleProofUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "scanmitra/center-proofs");
      const res = await axios.post("/api/uploads/cloudinary", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = String(res.data.secure_url || "");
      setIdentityProofUrl(uploadedUrl);
      setValue("identityProofUrl", uploadedUrl, { shouldValidate: true });
      toast.success("Identity proof uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingProof(false);
      event.target.value = "";
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {existingProfile ? "Edit Center Profile" : "Setup Your Center"}
          </h1>
          <p className="text-muted-foreground">
            {existingProfile ? "Update your center details" : "Complete your center profile to start receiving bookings"}
          </p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Center Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Building2 className="w-4 h-4 inline mr-1" /> Center Name *
              </label>
              <input
                {...register("centerName")}
                placeholder="Your diagnostic center name"
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              {errors.centerName && <p className="text-xs text-destructive mt-1">{errors.centerName.message}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <MapPin className="w-4 h-4 inline mr-1" /> Full Address *
              </label>
              <input
                {...register("address")}
                placeholder="Complete address with city and state"
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
            </div>

            {/* Phone numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Phone className="w-4 h-4 inline mr-1" /> Phone 1 *
                </label>
                <input
                  {...register("phone1")}
                  placeholder="Primary phone"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                {errors.phone1 && <p className="text-xs text-destructive mt-1">{errors.phone1.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone 2</label>
                <input
                  {...register("phone2")}
                  placeholder="Optional"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone 3</label>
                <input
                  {...register("phone3")}
                  placeholder="Optional"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Registration IDs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Shield className="w-4 h-4 inline mr-1" /> Clinic License
                </label>
                <input
                  {...register("clinicLicenseNo")}
                  placeholder="License number"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Radiologist Reg ID</label>
                <input
                  {...register("radiologistRegId")}
                  placeholder="Registration ID"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gov Health Reg</label>
                <input
                  {...register("govHealthReg")}
                  placeholder="Registration ID"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Upload className="w-4 h-4 inline mr-1" /> Identity Proof
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleProofUpload}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm"
              />
              {uploadingProof && (
                <p className="text-xs text-muted-foreground mt-2">Uploading...</p>
              )}
              {identityProofUrl && (
                <a
                  href={identityProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary mt-2 inline-block hover:underline"
                >
                  View uploaded document
                </a>
              )}
            </div>

            {/* Available Scans */}
            <div>
              <label className="block text-sm font-medium mb-2">Available Scan Types *</label>
              <div className="flex flex-wrap gap-2">
                {SCAN_TYPES.map((scan) => (
                  <button
                    key={scan}
                    type="button"
                    onClick={() => toggleScan(scan)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedScans.includes(scan)
                        ? "gradient-primary text-white shadow-lg shadow-blue-500/20"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    {scan}
                  </button>
                ))}
              </div>
              {errors.availableScans && (
                <p className="text-xs text-destructive mt-1">{errors.availableScans.message}</p>
              )}
            </div>

            {/* Machine Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Cpu className="w-4 h-4 inline mr-1" /> Machine Brand
                </label>
                <input
                  {...register("machineBrand")}
                  placeholder="e.g. Siemens"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <input
                  {...register("machineModel")}
                  placeholder="e.g. Somatom"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <input
                  {...register("machineYear", { valueAsNumber: true })}
                  type="number"
                  placeholder="2023"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Timing + Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 inline mr-1" /> Opening Time *
                </label>
                <input
                  {...register("openingTime")}
                  type="time"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                {errors.openingTime && <p className="text-xs text-destructive mt-1">{errors.openingTime.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Closing Time *</label>
                <input
                  {...register("closingTime")}
                  type="time"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                {errors.closingTime && <p className="text-xs text-destructive mt-1">{errors.closingTime.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Daily Capacity</label>
                <input
                  {...register("dailyPatientCapacity", { valueAsNumber: true })}
                  type="number"
                  placeholder="50"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Emergency Support */}
            <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
              <input
                {...register("emergencySupport")}
                type="checkbox"
                id="emergency"
                className="w-4 h-4 rounded accent-primary"
              />
              <label htmlFor="emergency" className="text-sm font-medium cursor-pointer">
                24/7 Emergency Support Available
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {existingProfile ? "Update Profile" : "Save & Continue"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
