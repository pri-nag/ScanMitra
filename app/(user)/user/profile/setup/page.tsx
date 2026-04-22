"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { BLOOD_GROUPS, INDIAN_STATES, patientProfileSchema, type PatientProfileInput } from "@/lib/validations";
import Navbar from "@/components/shared/Navbar";
import { useRouter } from "next/navigation";

export default function UserProfileSetupPage() {
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PatientProfileInput>({
    resolver: zodResolver(patientProfileSchema),
  });

  useEffect(() => {
    axios.get("/api/users").then((res) => {
      if (res.data.patient) {
        reset({ ...res.data.patient, dob: res.data.patient.dob?.slice(0, 10) });
      }
    }).catch(() => undefined);
  }, [reset]);

  const onSubmit = async (values: PatientProfileInput) => {
    await axios.put("/api/users", values);
    toast.success("Profile saved");
    router.push("/user/dashboard");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-14">
        <h1 className="text-3xl font-bold mb-6">Setup Patient Profile</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-2xl p-6 grid sm:grid-cols-2 gap-4">
          <input {...register("name")} placeholder="Full name" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <input {...register("mobile")} placeholder="Mobile" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <input {...register("address")} placeholder="Address" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border sm:col-span-2" />
          <input {...register("city")} placeholder="City" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <select {...register("state")} className="px-3 py-2 rounded-lg bg-secondary/60 border border-border">
            <option value="">State</option>
            {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <input type="number" {...register("age", { valueAsNumber: true })} placeholder="Age" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <input type="date" {...register("dob")} className="px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <input {...register("emergencyContact")} placeholder="Emergency contact" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <select {...register("bloodGroup")} className="px-3 py-2 rounded-lg bg-secondary/60 border border-border">
            <option value="">Blood group</option>
            {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <textarea {...register("medicalHistory")} placeholder="Medical history (optional)" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border sm:col-span-2" />
          <button disabled={isSubmitting} className="sm:col-span-2 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
            Save Profile
          </button>
          {Object.keys(errors).length > 0 && (
            <p className="sm:col-span-2 text-xs text-destructive">Please fix the highlighted fields.</p>
          )}
        </form>
      </main>
    </div>
  );
}
