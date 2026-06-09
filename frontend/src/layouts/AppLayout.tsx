import { NavLink, Outlet } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";

// ── Navigation Links ────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/dashboard", label: "Dashboard", end: false },
  { to: "/upload", label: "Upload Reports", end: false },
  { to: "/route-planner", label: "Route Planner", end: false },
] as const;

// ── Layout ──────────────────────────────────────────────────────────────────

export default function AppLayout() {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col">
      <ScrollToTop />

      {/* ── Top Navigation ──────────────────────────────────────────────── */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <img 
              src="/logo.png" 
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
              alt="V-PRO Logo" 
            />
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none">
                VPRO
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
                Voyage Performance &amp; Route Optimization
              </p>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end ?? false}
                id={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  `relative px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "text-foreground font-semibold bg-[hsl(210,70%,50%)]/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {/* Active accent underline */}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[hsl(210,70%,50%)] shadow-[0_0_8px_hsl(210,70%,50%/0.4)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main Viewport ───────────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
