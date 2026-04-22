"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import { Menu, X, LogOut, User, Building2, Calendar, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/images/scanmitra-logo-v2.png"
              alt="ScanMitra"
              width={170}
              height={38}
              className="h-9 w-auto object-contain group-hover:scale-[1.01] transition-transform"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {!session ? (
              <>
                <Link href="/#about" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50">
                  About
                </Link>
                <Link href="/#collaborations" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50">
                  Collaborations
                </Link>
                <Link href="/signup" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50">
                  Sign Up
                </Link>
                <Link href="/login" className="ml-2 px-5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  Login
                </Link>
              </>
            ) : session.user.role === "USER" ? (
              <>
                <Link href="/user/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Link href="/user/bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50">
                  <Calendar className="w-4 h-4" /> My Bookings
                </Link>
                <Link href="/user/profile/setup" className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <div className="ml-2 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{session.user.email}</span>
                  <button onClick={handleLogout} className="flex items-center gap-1 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/center/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Link href="/center/services" className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50">
                  <Building2 className="w-4 h-4" /> Services
                </Link>
                <Link href="/center/profile/setup" className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <div className="ml-2 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{session.user.email}</span>
                  <button onClick={handleLogout} className="flex items-center gap-1 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {!session ? (
              <>
                <Link href="/#about" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors">About</Link>
                <Link href="/#collaborations" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors">Collaborations</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors">Sign Up</Link>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-center rounded-lg bg-primary text-primary-foreground mt-2">Login</Link>
              </>
            ) : session.user.role === "USER" ? (
              <>
                <Link href="/user/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                <Link href="/user/bookings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg"><Calendar className="w-4 h-4" /> My Bookings</Link>
                <Link href="/user/profile/setup" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg"><User className="w-4 h-4" /> Profile</Link>
                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg"><LogOut className="w-4 h-4" /> Logout</button>
              </>
            ) : (
              <>
                <Link href="/center/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                <Link href="/center/services" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg"><Building2 className="w-4 h-4" /> Services</Link>
                <Link href="/center/profile/setup" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg"><User className="w-4 h-4" /> Profile</Link>
                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg"><LogOut className="w-4 h-4" /> Logout</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
