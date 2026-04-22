import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

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

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

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
