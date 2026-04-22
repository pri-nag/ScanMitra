import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { patientProfileSchema } from "@/lib/validations";
import { jsonNoStore } from "@/lib/http-cache";

// GET /api/users - Get patient profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        userId: true,
        name: true,
        address: true,
        city: true,
        state: true,
        mobile: true,
        age: true,
        sex: true,
        dob: true,
        maritalStatus: true,
        emergencyContact: true,
        medicalHistory: true,
        bloodGroup: true,
      },
    });

    return jsonNoStore({ patient });
  } catch (error) {
    console.error("Get profile error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}

// PUT /api/users - Create or update patient profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const validation = patientProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = {
      ...validation.data,
      age: validation.data.age ?? undefined,
      dob: validation.data.dob ? new Date(validation.data.dob) : undefined,
      emergencyContact: validation.data.emergencyContact || undefined,
    };

    const patient = await prisma.patient.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        ...data,
        userId: session.user.id,
      },
    });

    return jsonNoStore({ patient, message: "Profile saved successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
