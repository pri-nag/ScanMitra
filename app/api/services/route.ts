import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serviceSchema } from "@/lib/validations";
import { cacheDel } from "@/lib/redis-cache";
import { jsonNoStore } from "@/lib/http-cache";

// POST /api/services - Add a new service
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CENTER") {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const center = await prisma.center.findUnique({
      where: { userId: session.user.id },
    });

    if (!center) {
      return jsonNoStore({ error: "Center profile not found" }, 404);
    }

    const body = await req.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        ...validation.data,
        centerId: center.id,
      },
    });

    await cacheDel(["centers:list:::1:12", `centers:detail:${center.id}:today:first`]);
    return jsonNoStore({ service, message: "Service added" }, 201);
  } catch (error) {
    console.error("Add service error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}

// GET /api/services - Get center's services
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const page = 1;
    const pageSize = 100;
    const center = await prisma.center.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!center) {
      return jsonNoStore({ error: "Center not found" }, 404);
    }

    const services = await prisma.service.findMany({
      where: { centerId: center.id },
      select: { id: true, name: true, duration: true, price: true, status: true, centerId: true },
      orderBy: { name: "asc" },
      skip: 0,
      take: pageSize,
    });

    return jsonNoStore({ services, page, pageSize });
  } catch (error) {
    console.error("Get services error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
