import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";

function isDatabaseUnavailableError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  return code === "P1001" || message.includes("Can't reach database server");
}

async function retryDbOperation<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      if (!isDatabaseUnavailableError(error) || attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, role } = validation.data;

    // Check if user already exists
    const existingUser = await retryDbOperation(() =>
      prisma.user.findUnique({
        where: { email },
      })
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await retryDbOperation(() =>
      prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
        },
      })
    );

    return NextResponse.json(
      {
        message: "Account created successfully",
        userId: user.id,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Signup error:", error);
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { error: "Database connection failed. Check network/VPN and try again." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
