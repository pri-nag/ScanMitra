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
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const maxDob = today.toISOString().slice(0, 10);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<PatientProfileInput>({
    resolver: zodResolver(patientProfileSchema),
  });
  const dob = watch("dob");

  useEffect(() => {
    if (!dob) {
      setValue("age", undefined, { shouldValidate: true });
      return;
    }

    const birthDate = new Date(`${dob}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) {
      setValue("age", undefined, { shouldValidate: true });
      return;
    }

    const todayDate = new Date();
    let age = todayDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = todayDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && todayDate.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    setValue("age", Math.max(age, 0), { shouldValidate: true });
  }, [dob, setValue]);

  useEffect(() => {
    axios.get("/api/users").then((res) => {
      if (res.data.patient) {
        const patient = res.data.patient as Partial<PatientProfileInput> & { dob?: string | null };
        reset({
          name: patient.name ?? "",
          address: patient.address ?? "",
          city: patient.city ?? "",
          state: patient.state ?? "",
          mobile: patient.mobile ?? "",
          age: patient.age ?? undefined,
          sex: patient.sex ?? undefined,
          dob: patient.dob ? patient.dob.slice(0, 10) : "",
          maritalStatus: patient.maritalStatus ?? undefined,
          emergencyContact: patient.emergencyContact ?? "",
          medicalHistory: patient.medicalHistory ?? "",
          bloodGroup: patient.bloodGroup ?? "",
        });
      }
    }).catch(() => undefined);
  }, [reset]);

  const onSubmit = async (values: PatientProfileInput) => {
    try {
      await axios.put("/api/users", values);
      toast.success("Profile saved");
      router.push("/user/dashboard");
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Failed to save profile";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-14">
        <h1 className="text-3xl font-bold mb-6">Setup Patient Profile</h1>
        <form
          onSubmit={handleSubmit(onSubmit, (formErrors) => {
            const firstError = Object.values(formErrors)[0];
            if (firstError?.message) {
              toast.error(String(firstError.message));
            } else {
              toast.error("Please fix the highlighted fields.");
            }
          })}
          className="glass rounded-2xl p-6 grid sm:grid-cols-2 gap-4"
        >
          <input {...register("name")} placeholder="Full name" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <input {...register("mobile")} placeholder="Mobile" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <input {...register("address")} placeholder="Address" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border sm:col-span-2" />
          <input {...register("city")} placeholder="City" className="px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
          <select {...register("state")} className="px-3 py-2 rounded-lg bg-secondary/60 border border-border">
            <option value="">State</option>
            {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <div>
            <input
              type="number"
              readOnly
              {...register("age", {
                setValueAs: (value) => {
                  if (value === "" || value === null || value === undefined) return undefined;
                  const parsed = Number(value);
                  return Number.isNaN(parsed) ? undefined : parsed;
                },
              })}
              placeholder="Age (auto-calculated from DOB)"
              className="w-full px-3 py-2 rounded-lg bg-secondary/60 border border-border"
            />
            {errors.age && <p className="text-xs text-destructive mt-1">{errors.age.message}</p>}
          </div>
          <div>
            <input type="date" max={maxDob} {...register("dob")} className="w-full px-3 py-2 rounded-lg bg-secondary/60 border border-border" />
            {errors.dob && <p className="text-xs text-destructive mt-1">{errors.dob.message}</p>}
          </div>
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
