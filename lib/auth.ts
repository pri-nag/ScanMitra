import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password || !credentials?.role) {
            throw new Error("Missing credentials");
          }

          const user = await retryDbOperation(() =>
            prisma.user.findUnique({
              where: { email: credentials.email },
            })
          );

          if (!user || user.role !== credentials.role) {
            throw new Error("Invalid email, password, or role");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email, password, or role");
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            if (
              error.message === "Invalid email, password, or role" ||
              error.message === "Missing credentials"
            ) {
              throw error;
            }
          }
          if (isDatabaseUnavailableError(error)) {
            throw new Error("Database connection failed. Check network/VPN and try again.");
          }
          throw new Error("Login service temporarily unavailable. Please try again.");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const userRole = (user as { role?: string }).role;
        if (userRole === "USER" || userRole === "CENTER") {
          token.role = userRole;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const mutableUser = session.user as { id?: string; role?: string };
        mutableUser.id = token.id as string | undefined;
        mutableUser.role = token.role as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
