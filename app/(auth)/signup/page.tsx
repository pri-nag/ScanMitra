"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2, User } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const GMAIL_PATTERN = "^[a-zA-Z0-9._%+-]+@gmail\\.com$";
const PASSWORD_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"USER" | "CENTER">("USER");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "USER" },
  });

  const handleRoleSwitch = (newRole: "USER" | "CENTER") => {
    setRole(newRole);
    setValue("role", newRole);
  };

  const onSubmit = async (data: SignupInput) => {
    setLoading(true);
    try {
      await axios.post("/api/auth/signup", data);
      toast.success("Account created! Redirecting to profile setup...");

      // Auto-login after signup
      const { signIn } = await import("next-auth/react");
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        role: data.role,
        redirect: false,
      });

      router.push(data.role === "USER" ? "/user/profile/setup" : "/center/profile/setup");
      router.refresh();
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#edf3f6]">

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <Image src="/images/scanmitra-logo-v2.png" alt="ScanMitra" width={220} height={48} className="h-10 w-auto object-contain" />
          </Link>
          <p className="text-muted-foreground text-sm mt-3">
            Create your account to get started
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          {/* Role Toggle */}
          <div className="flex bg-secondary/50 rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => handleRoleSwitch("USER")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                role === "USER"
                  ? "gradient-primary text-white shadow-lg shadow-blue-500/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" />
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch("CENTER")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                role === "CENTER"
                  ? "gradient-primary text-white shadow-lg shadow-blue-500/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Center
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@gmail.com"
                  pattern={GMAIL_PATTERN}
                  title="Please enter a valid @gmail.com email address"
                  className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1.5">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  minLength={8}
                  pattern={PASSWORD_PATTERN}
                  title="Minimum 8 characters with at least one lowercase, one uppercase, one number, and one special character"
                  className="w-full pl-10 pr-12 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1.5">{errors.password.message}</p>
              )}
              {!errors.password && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Must be at least 8 characters and include lowercase, uppercase, number, and special character.
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  minLength={8}
                  pattern={PASSWORD_PATTERN}
                  title="Minimum 8 characters with at least one lowercase, one uppercase, one number, and one special character"
                  className="w-full pl-10 pr-12 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1.5">{errors.confirmPassword.message}</p>
              )}
              {!errors.confirmPassword && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Confirm password should match and follow the same password rules.
                </p>
              )}
            </div>

            {/* Hidden role */}
            <input type="hidden" {...register("role")} />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to login */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
