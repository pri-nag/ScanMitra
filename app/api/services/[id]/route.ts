import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serviceSchema } from "@/lib/validations";
import { cacheDel } from "@/lib/redis-cache";
import { jsonNoStore } from "@/lib/http-cache";

// PUT /api/services/[id] - Edit a service
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CENTER") {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: validation.data,
      select: { id: true, centerId: true, name: true, duration: true, price: true, status: true },
    });

    await cacheDel(["centers:list:::1:12", `centers:detail:${service.centerId}:today:first`]);
    return jsonNoStore({ service, message: "Service updated" });
  } catch (error) {
    console.error("Update service error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}

// DELETE /api/services/[id] - Delete a service
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CENTER") {
      return jsonNoStore({ error: "Unauthorized" }, 401);
    }

    const deleted = await prisma.service.delete({
      where: { id: params.id },
      select: { centerId: true },
    });

    await cacheDel(["centers:list:::1:12", `centers:detail:${deleted.centerId}:today:first`]);
    return jsonNoStore({ message: "Service deleted" });
  } catch (error) {
    console.error("Delete service error:", error);
    return jsonNoStore({ error: "Internal server error" }, 500);
  }
}
