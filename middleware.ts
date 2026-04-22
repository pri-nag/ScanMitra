import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // User routes - only USER role
    if (path.startsWith("/user") && token?.role !== "USER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Center routes - only CENTER role
    if (path.startsWith("/center") && token?.role !== "CENTER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/user/:path*", "/center/:path*"],
};
