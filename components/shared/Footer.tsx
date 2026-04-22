import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/images/scanmitra-logo-v2.png"
                alt="ScanMitra"
                width={150}
                height={34}
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Smart diagnostic queue management platform. Book scans, track queues in real-time, and never wait unnecessarily.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/#about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link href="/#collaborations" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Collaborations</Link>
              <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Link href="/signup" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>support@scanmitra.com</p>
              <p>+91 98765 43210</p>
              <p>India</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ScanMitra. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ for better healthcare access
          </p>
        </div>
      </div>
    </footer>
  );
}
