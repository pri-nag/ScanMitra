// Next.js types augmentation for NextAuth
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "CENTER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "USER" | "CENTER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "CENTER";
  }
}
