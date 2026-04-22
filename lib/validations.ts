import { z } from "zod";

// ===== SHARED FIELD SCHEMAS =====

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .regex(
    /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
    "Only @gmail.com email addresses are allowed"
  );

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(
    /^[6-9]\d{9}$/,
    "Enter a valid Indian mobile number (10 digits, starts with 6-9)"
  );

export const optionalPhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number")
  .optional()
  .or(z.literal(""));

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)");

// ===== AUTH SCHEMAS =====

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["USER", "CENTER"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["USER", "CENTER"]),
});

// ===== PATIENT PROFILE SCHEMA =====

export const patientProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  mobile: phoneSchema,
  age: z
    .number()
    .min(0, "Age must be at least 0")
    .max(120, "Age must be at most 120")
    .optional()
    .nullable(),
  sex: z.enum(["Male", "Female", "Others"]).optional(),
  dob: z.string().optional(),
  maritalStatus: z
    .enum(["Married", "Unmarried", "Not wanna disclose"])
    .optional(),
  emergencyContact: optionalPhoneSchema,
  medicalHistory: z.string().optional(),
  bloodGroup: z.string().optional(),
});

// ===== CENTER PROFILE SCHEMA =====

export const centerProfileSchema = z.object({
  centerName: z.string().min(1, "Center name is required"),
  address: z.string().min(1, "Address is required"),
  phone1: phoneSchema,
  phone2: optionalPhoneSchema,
  phone3: optionalPhoneSchema,
  clinicLicenseNo: z.string().optional(),
  radiologistRegId: z.string().optional(),
  govHealthReg: z.string().optional(),
  identityProofUrl: z.string().optional(),
  availableScans: z.array(z.string()).min(1, "Select at least one scan type"),
  machineBrand: z.string().optional(),
  machineModel: z.string().optional(),
  machineYear: z.number().optional().nullable(),
  openingTime: timeSchema,
  closingTime: timeSchema,
  dailyPatientCapacity: z.number().min(1).optional().nullable(),
  emergencySupport: z.boolean().default(false),
});

// ===== BOOKING SCHEMA =====

export const bookingSchema = z.object({
  centerId: z.string().min(1),
  serviceId: z.string().min(1),
  patientName: z.string().min(1, "Patient name is required"),
  patientPhone: phoneSchema,
  slotTime: z.string().min(1, "Select a time slot"),
  additionalInfo: z.string().optional(),
});

// ===== SERVICE SCHEMA =====

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  price: z.number().min(0, "Price must be positive"),
  status: z.boolean().default(true),
});

// ===== WALK-IN SCHEMA =====

export const walkInSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  email: emailSchema,
  mobile: phoneSchema,
  serviceId: z.string().min(1, "Select a service"),
});

// ===== TYPES =====

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PatientProfileInput = z.infer<typeof patientProfileSchema>;
export type CenterProfileInput = z.infer<typeof centerProfileSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type WalkInInput = z.infer<typeof walkInSchema>;

// Indian states list for dropdown
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

export const SCAN_TYPES = [
  "X-Ray",
  "Ultrasound",
  "CT Scan",
  "MRI",
  "ECG",
  "Blood Test",
  "Pathology",
] as const;

export const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
] as const;
