import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        status: "up",
        checkedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
        },
      }
    );
  } catch (error: unknown) {
    const prismaLikeError = error as { code?: string; message?: string };
    console.error("DB health check failed:", prismaLikeError);

    const diagnostics =
      process.env.NODE_ENV !== "production"
        ? {
            code: prismaLikeError?.code ?? "UNKNOWN",
            message: prismaLikeError?.message ?? "Unknown DB error",
          }
        : undefined;

    return NextResponse.json(
      {
        ok: false,
        status: "down",
        checkedAt: new Date().toISOString(),
        diagnostics,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
        },
      }
    );
  }
}
