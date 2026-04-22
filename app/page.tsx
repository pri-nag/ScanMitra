import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import {
  Activity,
  ArrowRight, Shield, Clock, Zap,
  Building2, Stethoscope, Heart, ChevronRight, Star,
  BarChart3, Wifi, CalendarCheck
} from "lucide-react";

export const revalidate = 300;

export default function HomePage() {
  const features = [
    {
      icon: Clock,
      title: "Real-time Queue Tracking",
      description: "Know your exact position & estimated wait time. No more guessing in crowded waiting rooms.",
    },
    {
      icon: Zap,
      title: "Instant Token Assignment",
      description: "Get your token number immediately upon booking. Walk in confidently with your slot reserved.",
    },
    {
      icon: Shield,
      title: "Smart No-Show Management",
      description: "Automatic buffer system that promotes patients when others don't show up. Zero wasted slots.",
    },
    {
      icon: Wifi,
      title: "Live Status Updates",
      description: "Receive real-time notifications about queue movement, delays, and when it's your turn.",
    },
    {
      icon: CalendarCheck,
      title: "Easy Online Booking",
      description: "Book any diagnostic scan in seconds. Choose your center, service, and preferred time slot.",
    },
    {
      icon: BarChart3,
      title: "Center Analytics",
      description: "Diagnostic centers get powerful queue management tools, walk-in support, and delay broadcasting.",
    },
  ];

  const stats = [
    { value: "50+", label: "Diagnostic Centers" },
    { value: "10K+", label: "Patients Served" },
    { value: "99%", label: "On-Time Rate" },
    { value: "4.8★", label: "Average Rating" },
  ];

  return (
    <div className="min-h-screen bg-[#edf3f6]">
      <Navbar />

      {/* ========== HERO SECTION ========== */}
      <section className="relative pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
          <div className="rounded-none sm:rounded-2xl bg-[#d7ecea] border border-[#c6e0dd] py-16 px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-5">
              <Image
                src="/images/scanmitra-logo-v2.png"
                alt="ScanMitra logo"
                width={320}
                height={72}
                className="h-14 w-auto object-contain"
                priority
              />
            </div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 text-xs font-medium text-emerald-700 mb-8 border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              Smart Diagnostic Queue Management
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-[#15202b]">
              Smart Queue Management
              <br />
              for Medical Centers
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Book your ultrasound and X-ray appointments with real-time queue tracking.
              Skip the wait, get quality care.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium text-base flex items-center gap-2 hover:opacity-90 transition-all shadow"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#about"
                className="px-8 py-4 rounded-xl font-medium text-base bg-white border border-border hover:bg-secondary/50 transition-all flex items-center gap-2"
              >
                Learn More
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Quick stats bar */}
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mt-16 pt-8 border-t border-[#c1d8d5]">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ========== ABOUT SECTION ========== */}
      <section id="about" className="py-24 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary mb-3">WHY SCANMITRA</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Smarter Queues, Better Healthcare
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;re eliminating the frustration of long waits at diagnostic centers.
              Our platform connects patients with centers for a seamless experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group glass rounded-2xl p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Three Steps to Skip the Wait
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Stethoscope,
                title: "Find & Book",
                desc: "Search diagnostic centers by location or scan type. Pick your preferred time slot and book instantly.",
              },
              {
                step: "02",
                icon: Activity,
                title: "Track Live",
                desc: "See your queue position and ETA in real-time. Get push notifications when your turn approaches.",
              },
              {
                step: "03",
                icon: Heart,
                title: "Walk In & Done",
                desc: "Arrive at your scheduled time, skip the crowd, and get your scan done with zero wait.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                <div className="text-7xl font-black text-secondary/30 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 select-none">
                  {item.step}
                </div>
                <div className="relative pt-12">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== COLLABORATIONS ========== */}
      <section id="collaborations" className="py-24 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary mb-3">COLLABORATIONS</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by Diagnostic Centers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Leading diagnostic centers across India use ScanMitra to manage their queues efficiently.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "HealthScan Pro", icon: Building2 },
              { name: "MedVision Labs", icon: Stethoscope },
              { name: "DiagnoFirst", icon: Activity },
              { name: "ScanExpert India", icon: Star },
            ].map((partner) => (
              <div key={partner.name} className="glass rounded-xl p-6 text-center card-hover">
                <partner.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-sm font-medium">{partner.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA BANNER ========== */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0f8d3f] rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Skip the Queue?
              </h2>
              <p className="text-blue-100/80 mb-8 max-w-lg mx-auto">
                Join thousands of patients who save hours every month with ScanMitra&apos;s smart queue management.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold text-base flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Sign Up Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/signup"
                  className="px-8 py-4 rounded-xl font-medium text-base text-white border border-white/30 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Building2 className="w-5 h-5" />
                  Register Your Center
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
