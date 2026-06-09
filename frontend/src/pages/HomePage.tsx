import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

// ── Capability Item ─────────────────────────────────────────────────────────

function CapabilityTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5 shrink-0">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {label}
    </span>
  );
}

// ── Feature Card ────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 hover:border-[hsl(210,70%,50%)]/30 hover:bg-card/80 transition-all duration-300">
      <div className="size-10 rounded-lg bg-[hsl(210,70%,50%)]/10 border border-[hsl(210,70%,50%)]/20 flex items-center justify-center mb-4 group-hover:bg-[hsl(210,70%,50%)]/15 transition-colors">
        {icon}
      </div>
      <h3 className="text-sm font-bold mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// ── Step Card ───────────────────────────────────────────────────────────────

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center text-center p-6">
      <div className="size-12 rounded-full bg-[hsl(210,70%,50%)]/10 border border-[hsl(210,70%,50%)]/25 flex items-center justify-center mb-4">
        {icon}
      </div>
      <span className="text-[10px] uppercase tracking-widest text-[hsl(210,70%,60%)] font-bold mb-1.5">
        Step {number}
      </span>
      <h3 className="text-sm font-bold mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
        {description}
      </p>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

// ── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  usePageTitle("Home");

  return (
    <div className="min-h-screen">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(210,70%,50%)]/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[hsl(210,70%,50%)]/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          {/* Brand tag / Logo Mark */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src="/logo.png" 
              className="h-16 w-auto object-contain mb-4" 
              alt="V-PRO Logo" 
            />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(210,70%,50%)]/10 border border-[hsl(210,70%,50%)]/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(210,70%,60%)]">
                VPRO — Voyage Performance &amp; Route Optimization
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-5">
            Operational Intelligence for
            <br />
            <span className="bg-gradient-to-r from-[hsl(210,70%,60%)] to-[hsl(200,80%,55%)] bg-clip-text text-transparent">
              Modern Maritime Fleets
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-[600px] mx-auto mb-10 leading-relaxed">
            Transforming Noon Reports into Actionable Voyage Intelligence.
            Monitor vessel performance, analyze fuel efficiency, and plan optimal routes
            from a single operational dashboard.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <Link
              to="/dashboard"
              id="cta-dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(210,70%,50%)] text-white text-sm font-semibold hover:bg-[hsl(210,70%,45%)] transition-all shadow-lg shadow-[hsl(210,70%,50%)]/25 hover:shadow-xl hover:shadow-[hsl(210,70%,50%)]/30 hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              Open Dashboard
            </Link>
            <Link
              to="/upload"
              id="cta-upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border/60 bg-card/60 text-sm font-semibold hover:bg-card hover:border-border transition-all hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              Upload Reports
            </Link>
          </div>

          {/* ── Capability Highlights ────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-4 rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm max-w-[800px] mx-auto">
            <CapabilityTag label="Historical Route Intelligence" />
            <CapabilityTag label="Voyage Mapping" />
            <CapabilityTag label="Operational Insights Engine" />
            <CapabilityTag label="Route Recommendation System" />
            <CapabilityTag label="Weather-Aware Architecture" />
          </div>
        </div>
      </section>

      {/* ── Platform Overview ──────────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Platform Overview
          </h2>
          <p className="text-sm text-muted-foreground max-w-[500px] mx-auto">
            Three integrated modules power your maritime analytics workflow —
            from data ingestion to actionable intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            }
            title="Vessel Analytics"
            description="KPI dashboards with fuel consumption, speed trends, weather patterns, operational timelines, and voyage route mapping — all derived from noon report data."
          />
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            }
            title="Route Intelligence"
            description="Historical shipping corridor analysis with multi-route comparison, composite scoring, weather risk assessment, and fuel efficiency estimation."
          />
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            }
            title="Report Ingestion"
            description="Drag-and-drop Excel upload with automated column detection, intelligent parsing, and instant database storage for vessel noon reports."
          />
        </div>
      </section>

      {/* ── Vessel Analytics Features ──────────────────────────────────────── */}
      <section className="border-t border-border/30">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-8 rounded-lg bg-[hsl(210,70%,50%)]/10 border border-[hsl(210,70%,50%)]/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 text-[hsl(210,70%,60%)]">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Vessel Analytics
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-10 max-w-[600px]">
            Comprehensive performance monitoring derived directly from your operational noon reports.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
              title="KPI Dashboard"
              description="Seven operational KPI cards covering voyage, fuel, ROB, weather, machinery, and reporting metrics."
            />
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>}
              title="Trend Charts"
              description="Interactive fuel, speed/RPM, and weather trend visualizations across your selected date range."
            />
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
              title="Operational Timeline"
              description="Chronological event stream showing position changes, vessel conditions, and operational remarks."
            />
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]"><path d="M9 6.882l-7-3.5v13.236l7 3.5 6-3 7 3.5V7.382l-7-3.5-6 3z" /><path d="M9 6.882v13.236" /><path d="M15 3.882v13.236" /></svg>}
              title="Voyage Mapping"
              description="Interactive Leaflet map plotting actual vessel positions from noon report coordinates."
            />
          </div>
        </div>
      </section>

      {/* ── Route Intelligence Features ────────────────────────────────────── */}
      <section className="border-t border-border/30">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-8 rounded-lg bg-[hsl(210,70%,50%)]/10 border border-[hsl(210,70%,50%)]/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 text-[hsl(210,70%,60%)]">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Route Intelligence
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-10 max-w-[600px]">
            Data-driven route recommendations based on verified historical shipping corridors and Admiralty distances.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>}
              title="Historical Corridors"
              description="Pre-configured shipping routes derived from actual noon report positions and Admiralty Distance logs."
            />
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]"><path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" /></svg>}
              title="Multi-Route Comparison"
              description="Auditable comparison table ranking corridors by composite score, distance, fuel, weather risk, and reliability."
            />
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]"><path d="M2 12 7 2" /><path d="m7 2 5 10" /><path d="m12 12 5-10" /><path d="m17 2 5 10" /><path d="M2 12h20" /><path d="M7 22V12" /><path d="M17 22V12" /></svg>}
              title="Score Breakdown"
              description="Transparent scoring across four dimensions — distance, weather, fuel efficiency, and historical reliability."
            />
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>}
              title="Weather Risk Assessment"
              description="Risk-level badges (Low, Moderate, High) based on historical weather patterns along each corridor."
            />
          </div>
        </div>
      </section>

      {/* ── Upload Workflow ─────────────────────────────────────────────────── */}
      <section className="border-t border-border/30 bg-gradient-to-b from-muted/10 to-transparent">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Upload Workflow
          </h2>
          <p className="text-sm text-muted-foreground max-w-[450px] mx-auto mb-12">
            From Excel file to analyzed voyage data in three simple steps.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {/* Connector lines (hidden on mobile) */}
            <div className="hidden sm:block absolute top-6 left-1/4 right-1/4 h-px bg-border/40" />

            <StepCard
              number="1"
              title="Select Report"
              description="Choose your vessel noon report Excel file (.xlsx or .xls) via drag-and-drop or file browser."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                </svg>
              }
            />
            <StepCard
              number="2"
              title="Upload & Parse"
              description="Automated column detection and intelligent parsing extracts structured data from your report."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
              }
            />
            <StepCard
              number="3"
              title="Analyze"
              description="Instantly view KPIs, trends, route plots, and operational insights on the analytics dashboard."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-[hsl(210,70%,60%)]">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              }
            />
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center gap-2 mt-10 px-5 py-2.5 rounded-lg bg-[hsl(210,70%,50%)] text-white text-sm font-semibold hover:bg-[hsl(210,70%,45%)] transition-all shadow-lg shadow-[hsl(210,70%,50%)]/20 hover:-translate-y-0.5"
          >
            Start Uploading
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/30">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                className="h-8 w-auto object-contain" 
                alt="V-PRO Logo" 
              />
              <div>
                <p className="text-sm font-bold tracking-tight">VPRO</p>
                <p className="text-[10px] text-muted-foreground">
                  Voyage Performance &amp; Route Optimization
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/upload" className="hover:text-foreground transition-colors">Upload</Link>
              <Link to="/route-planner" className="hover:text-foreground transition-colors">Route Planner</Link>
            </div>

            {/* Meta */}
            <div className="text-center sm:text-right">
              <p className="text-[11px] text-muted-foreground/60">
                Deployed on <span className="text-muted-foreground font-medium">vpro.asmitlabs.me</span>
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                © {new Date().getFullYear()} VPRO. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
