import { useState } from "react";
import UploadReportPage from "@/pages/UploadReportPage";
import DashboardPage from "@/pages/DashboardPage";
import RoutePlannerPage from "@/pages/RoutePlannerPage";

type View = "dashboard" | "upload" | "route-planner";

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");

  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Top Navigation ──────────────────────────────────────────────── */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[hsl(210,70%,50%)] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 text-white"
              >
                <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M19.38 20A11.4 11.4 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
                <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
                <path d="M12 10v4" />
                <path d="M12 2v3" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none">
                Vessel Performance System
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Operational Analytics Platform
              </p>
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <button
              id="nav-dashboard"
              onClick={() => setActiveView("dashboard")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "dashboard"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </button>
            <button
              id="nav-route-planner"
              onClick={() => setActiveView("route-planner")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "route-planner"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Route Planner
            </button>
            <button
              id="nav-upload"
              onClick={() => setActiveView("upload")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "upload"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload Reports
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Viewport ───────────────────────────────────────────────── */}
      <main className="flex-1">
        {activeView === "dashboard" ? (
          <DashboardPage />
        ) : activeView === "upload" ? (
          <UploadReportPage />
        ) : (
          <RoutePlannerPage />
        )}
      </main>
    </div>
  );
}
