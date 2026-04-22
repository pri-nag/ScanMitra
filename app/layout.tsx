import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/shared/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScanMitra — Smart Diagnostic Queue Management",
  description:
    "ScanMitra is a modern medical diagnostic center queue management platform. Book scans, track your queue in real-time, and never wait unnecessarily again.",
  keywords: ["medical", "diagnostic", "queue", "booking", "scan", "MRI", "CT", "X-Ray"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(0 0% 100%)",
                color: "hsl(210 20% 14%)",
                border: "1px solid hsl(170 18% 80%)",
                borderRadius: "12px",
              },
              success: {
                iconTheme: {
                  primary: "#16a34a",
                  secondary: "hsl(0 0% 100%)",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "hsl(0 0% 100%)",
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
