import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { centerProfileSchema } from "@/lib/validations";
import { cacheDel, cacheGet, cacheSet } from "@/lib/redis-cache";
import { jsonNoStore, jsonPublicCache } from "@/lib/http-cache";

// GET /api/centers - List all centers with search/filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const scanType = searchParams.get("scanType") || "";
    const mine = searchParams.get("mine");

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") || 12), 1), 50);
    const skip = (page - 1) * pageSize;

    if (mine === "1" || mine === "true") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || session.user.role !== "CENTER") {
        return jsonNoStore({ error: "Unauthorized" }, 401);
      }

      const center = await prisma.center.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          userId: true,
          centerName: true,
          address: true,
          phone1: true,
          phone2: true,
          phone3: true,
          clinicLicenseNo: true,
          radiologistRegId: true,
          govHealthReg: true,
          identityProofUrl: true,
          availableScans: true,
          machineBrand: true,
          machineModel: true,
          machineYear: true,
          openingTime: true,
          closingTime: true,
          dailyPatientCapacity: true,
          emergencySupport: true,
          services: {
            select: { id: true, name: true, duration: true, price: true, status: true },
            orderBy: { name: "asc" },
          },
        },
      });

      return jsonNoStore({ center });
    }

    const where: Prisma.CenterWhereInput = {};

    if (search) {
      where.OR = [
        { centerName: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (scanType) {
      where.availableScans = { has: scanType };
    }

    const cacheKey = `centers:list:${search}:${scanType}:${page}:${pageSize}`;
    const cached = await cacheGet<{ centers: unknown[]; total: number; page: number; pageSize: number }>(cacheKey);
    if (cached) {
      return jsonPublicCache(cached, 60, 120);
    }

    const [centers, total] = await Promise.all([
      prisma.center.findMany({
        where,
        select: {
          id: true,
          centerName: true,
          address: true,
          openingTime: true,
          closingTime: true,
          availableScans: true,
          emergencySupport: true,
          services: {
            where: { status: true },
            select: { id: true, name: true, price: true, duration: true },
          },
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { centerName: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.center.count({ where }),
    ]);

    const payload = { centers, total, page, pageSize };
    await cacheSet(cacheKey, payload, 60);
    return jsonPublicCache(payload, 60, 120);
  } catch (error) {
    console.error("Get centers error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}

// PUT /api/centers - Create or update center profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CENTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = centerProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = {
      ...validation.data,
      phone2: validation.data.phone2 || undefined,
      phone3: validation.data.phone3 || undefined,
      machineYear: validation.data.machineYear ?? undefined,
      dailyPatientCapacity: validation.data.dailyPatientCapacity ?? undefined,
    };

    const center = await prisma.center.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        ...data,
        userId: session.user.id,
      },
    });

    await cacheDel([
      "centers:list:::1:12",
      `centers:detail:${center.id}:today:first`,
    ]);

    return jsonNoStore({ center, message: "Center profile saved successfully" });
  } catch (error) {
    console.error("Update center error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
