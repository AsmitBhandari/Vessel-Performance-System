import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getVessels,
  getVesselDashboard,
  getFuelTrend,
  getSpeedTrend,
  getWeatherTrend,
  getTimeline,
  getOperationalInsights,
  getRoutePositions,
} from "@/services/api";
import type {
  VesselInfo,
  DashboardPayload,
  FuelTrendPoint,
  SpeedTrendPoint,
  WeatherTrendPoint,
  TimelineEvent,
  OperationalInsight,
  RouteDataPayload,
} from "@/types";
import { FuelTrendChart, SpeedTrendChart, WeatherTrendChart } from "@/components/SvgCharts";
import RouteMap from "@/components/RouteMap";
import { usePageTitle } from "@/hooks/usePageTitle";

// ── Formatting Helpers ──────────────────────────────────────────────────────

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined) return "—";
  return v.toFixed(decimals);
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTimelineDate(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Skeleton Loader ─────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted/60 rounded ${className}`} />;
}

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

// ── KPI Metric Row ──────────────────────────────────────────────────────────

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">
        {value}
        {unit && <span className="text-xs text-muted-foreground font-normal ml-1">{unit}</span>}
      </span>
    </div>
  );
}

// ── Main Dashboard Page ─────────────────────────────────────────────────────

export default function DashboardPage() {
  usePageTitle("Dashboard");

  // Filter state
  const [vessels, setVessels] = useState<VesselInfo[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<VesselInfo | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [severeThreshold, setSevereThreshold] = useState(5);

  // Data state
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [fuelTrend, setFuelTrend] = useState<FuelTrendPoint[]>([]);
  const [speedTrend, setSpeedTrend] = useState<SpeedTrendPoint[]>([]);
  const [weatherTrend, setWeatherTrend] = useState<WeatherTrendPoint[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [insights, setInsights] = useState<OperationalInsight[]>([]);
  const [routeData, setRouteData] = useState<RouteDataPayload | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load vessel list on mount ───────────────────────────────────────────
  useEffect(() => {
    getVessels()
      .then((v) => {
        setVessels(v);
        if (v.length > 0) setSelectedVessel(v[0]);
      })
      .catch(() => setError("Failed to load vessels. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  // ── Load analytics when vessel or filters change ────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedVessel) return;
    setLoading(true);
    setError(null);
    try {
      const [dash, fuel, speed, weather, tl, ins, route] = await Promise.all([
        getVesselDashboard(
          selectedVessel.id,
          startDate || undefined,
          endDate || undefined,
          severeThreshold
        ),
        getFuelTrend(selectedVessel.vesselName, startDate || undefined, endDate || undefined),
        getSpeedTrend(selectedVessel.vesselName, startDate || undefined, endDate || undefined),
        getWeatherTrend(selectedVessel.vesselName, startDate || undefined, endDate || undefined),
        getTimeline(selectedVessel.vesselName, startDate || undefined, endDate || undefined),
        getOperationalInsights(selectedVessel.vesselName, startDate || undefined, endDate || undefined, severeThreshold),
        getRoutePositions(selectedVessel.vesselName, startDate || undefined, endDate || undefined),
      ]);
      setDashboard(dash);
      setFuelTrend(fuel);
      setSpeedTrend(speed);
      setWeatherTrend(weather);
      setTimeline(tl);
      setInsights(ins);
      setRouteData(route);
    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [selectedVessel, startDate, endDate, severeThreshold]);

  useEffect(() => {
    if (selectedVessel) loadData();
  }, [selectedVessel, loadData]);

  // ── Empty State ─────────────────────────────────────────────────────────
  if (!loading && vessels.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-8 text-muted-foreground">
            <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M19.38 20A11.4 11.4 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
            <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-1">No Analytics Available</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Upload a vessel noon report to begin analysis. Head to the{" "}
          <a href="/upload" className="text-[hsl(210,70%,60%)] underline hover:text-[hsl(210,70%,50%)] transition-colors">Upload Reports</a>{" "}
          page to get started.
        </p>
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────
  if (error && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-8 text-destructive">
            <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-1">Connection Error</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const d = dashboard;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ── Global Filters Bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Vessel Selector */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Vessel</label>
          <select
            id="vessel-selector"
            value={selectedVessel?.id ?? ""}
            onChange={(e) => {
              const v = vessels.find((v) => v.id === Number(e.target.value));
              if (v) setSelectedVessel(v);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[160px] focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {vessels.map((v) => (
              <option key={v.id} value={v.id}>{v.vesselName}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">From</label>
          <input
            id="filter-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">To</label>
          <input
            id="filter-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Severe Weather Threshold  */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Severe BF</label>
          <input
            id="filter-threshold"
            type="number"
            min={1}
            max={12}
            value={severeThreshold}
            onChange={(e) => setSevereThreshold(Number(e.target.value))}
            className="h-9 w-20 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Clear Filters */}
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            className="h-9 px-3 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* ── Loading Skeleton ────────────────────────────────────────────── */}
      {loading && !d && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
      )}

      {/* ── KPI Cards Grid ──────────────────────────────────────────────── */}
      {d && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Card 1 — Reporting Overview */}
            <Card id="kpi-overview">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Reporting Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Metric label="Total Reports" value={String(d.overview.totalReports)} />
                <Metric label="Coverage" value={fmt(d.overview.reportingCoverage, 1)} unit="%" />
                <Metric label="First Report" value={fmtDate(d.overview.firstReportDate)} />
                <Metric label="Latest Report" value={fmtDate(d.overview.latestReportDate)} />
              </CardContent>
            </Card>

            {/* Card 2 — Voyage Performance */}
            <Card id="kpi-voyage">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Voyage Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Metric label="Total Distance" value={fmt(d.voyage.totalDistanceSailed, 1)} unit="NM" />
                <Metric label="Avg Speed (weighted)" value={fmt(d.voyage.averageSpeed, 2)} unit="kts" />
                <Metric label="Max Speed" value={fmt(d.voyage.maximumSpeed, 1)} unit="kts" />
                <Metric label="Min Speed" value={fmt(d.voyage.minimumSpeed, 1)} unit="kts" />
              </CardContent>
            </Card>

            {/* Card 3 — Operational Status (highlighted) */}
            <Card id="kpi-operations" className="border-[hsl(210,70%,50%)]/30 bg-[hsl(210,70%,50%)]/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-[hsl(210,70%,60%)] font-medium">
                  Operational Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Metric label="Underway" value={String(d.operations.daysUnderway)} unit="days" />
                <Metric label="At Anchor" value={String(d.operations.daysAtAnchor)} unit="days" />
                <Metric label="Ballast" value={String(d.operations.daysInBallast)} unit="days" />
                <Metric label="Loaded" value={String(d.operations.daysLoaded)} unit="days" />
              </CardContent>
            </Card>

            {/* Card 4 — Fuel Performance */}
            <Card id="kpi-fuel">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Fuel Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Metric label="Total LSFO" value={fmt(d.fuel.totalLsfoConsumed, 2)} unit="MT" />
                <Metric label="Total HSFO" value={fmt(d.fuel.totalHsfoConsumed, 2)} unit="MT" />
                <Metric label="Total MGO" value={fmt(d.fuel.totalMgoConsumed, 2)} unit="MT" />
                <Metric label="Avg Daily LSFO" value={fmt(d.fuel.averageDailyFuelConsumption.lsfo, 2)} unit="MT/d" />
              </CardContent>
            </Card>

            {/* Card 5 — ROB Analytics */}
            <Card id="kpi-rob">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  ROB Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 mt-1">LSFO</div>
                <Metric label="Opening" value={fmt(d.rob.lsfo.opening, 1)} unit="MT" />
                <Metric label="Closing" value={fmt(d.rob.lsfo.closing, 1)} unit="MT" />
                <Metric label="Drawdown" value={fmt(d.rob.lsfo.drawdown, 1)} unit="MT" />
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 mt-3">MGO</div>
                <Metric label="Opening" value={fmt(d.rob.mgo.opening, 1)} unit="MT" />
                <Metric label="Closing" value={fmt(d.rob.mgo.closing, 1)} unit="MT" />
                <Metric label="Drawdown" value={fmt(d.rob.mgo.drawdown, 1)} unit="MT" />
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 mt-3">Fresh Water</div>
                <Metric label="Opening" value={fmt(d.rob.freshWater.opening, 1)} unit="MT" />
                <Metric label="Closing" value={fmt(d.rob.freshWater.closing, 1)} unit="MT" />
                <Metric label="Drawdown" value={fmt(d.rob.freshWater.drawdown, 1)} unit="MT" />
              </CardContent>
            </Card>

            {/* Card 6 — Weather Analytics */}
            <Card id="kpi-weather">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Weather Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Metric label="Avg Beaufort" value={fmt(d.weather.averageBeaufort, 1)} />
                <Metric label="Max Beaufort" value={fmt(d.weather.maximumBeaufort, 1)} />
                <Metric label="Severe Weather Days" value={String(d.weather.severeWeatherDays)} unit="days" />
                <Metric label="Avg Wind Speed" value={fmt(d.weather.averageWindSpeed, 1)} unit="kts" />
              </CardContent>
            </Card>

            {/* Card 7 — Machinery Analytics */}
            <Card id="kpi-machinery">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Machinery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Metric label="AE1 Hours" value={fmt(d.machinery.ae1TotalRunningHours, 1)} unit="hrs" />
                <Metric label="AE2 Hours" value={fmt(d.machinery.ae2TotalRunningHours, 1)} unit="hrs" />
                <Metric label="AE3 Hours" value={fmt(d.machinery.ae3TotalRunningHours, 1)} unit="hrs" />
                <Metric label="Total Auxiliary" value={fmt(d.machinery.totalAuxiliaryEngineHours, 1)} unit="hrs" />
              </CardContent>
            </Card>
          </div>

          {/* ── Trend Charts ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card id="chart-fuel">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Fuel Consumption Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FuelTrendChart data={fuelTrend} />
              </CardContent>
            </Card>

            <Card id="chart-speed">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Speed & RPM Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SpeedTrendChart data={speedTrend} />
              </CardContent>
            </Card>

            <Card id="chart-weather">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Weather Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeatherTrendChart data={weatherTrend} />
              </CardContent>
            </Card>
          </div>

          {/* ── Voyage Route ──────────────────────────────────────────────── */}
          <Card id="voyage-route-section">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Voyage Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              {routeData && routeData.totalPoints > 0 ? (
                <div className="space-y-4">
                  {/* Route Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Points Plotted</p>
                      <p className="text-lg font-bold tabular-nums">{routeData.totalPoints}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Start Date</p>
                      <p className="text-sm font-semibold">{routeData.startDate ? fmtDate(routeData.startDate) : "—"}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">End Date</p>
                      <p className="text-sm font-semibold">{routeData.endDate ? fmtDate(routeData.endDate) : "—"}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Distance Covered</p>
                      <p className="text-lg font-bold tabular-nums">
                        {routeData.totalDistance > 0 ? `${routeData.totalDistance} NM` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Map */}
                  <RouteMap positions={routeData.positions} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7 text-muted-foreground">
                      <path d="M9 6.882l-7-3.5v13.236l7 3.5 6-3 7 3.5V7.382l-7-3.5-6 3z" />
                      <path d="M9 6.882v13.236" />
                      <path d="M15 3.882v13.236" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    No route data available for the selected reporting period.
                  </p>
                  <p className="text-xs text-muted-foreground/70 max-w-sm">
                    Upload vessel reports containing valid position information to generate voyage tracks.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Operational Insights ─────────────────────────────────────────── */}
          <Card id="insights-section">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Operational Insights
              </CardTitle>
              {insights.length > 0 && (
                <div className="text-[11px] text-muted-foreground font-medium flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                    Warnings: {insights.filter(i => i.type === "WARNING").length}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" />
                    Information: {insights.filter(i => i.type === "INFO").length}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Positive Observations: {insights.filter(i => i.type === "POSITIVE").length}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No significant operational insights available for the selected reporting period.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Group insights by category */}
                  {["Voyage", "Fuel", "Weather", "Operations", "ROB", "Machinery", "General"]
                    .map(category => {
                      const categoryInsights = insights.filter(i => i.category === category);
                      if (categoryInsights.length === 0) return null;
                      return (
                        <div key={category} className="space-y-2">
                          <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider border-b border-border/40 pb-1">
                            {category}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {categoryInsights.map((insight, idx) => {
                              const isWarning = insight.type === "WARNING";
                              const isInfo = insight.type === "INFO";
                              
                              let icon = (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 shrink-0 mt-0.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                              );
                              let alertClass = "border-emerald-500/20 bg-emerald-500/5 text-emerald-400";
                              
                              if (isWarning) {
                                icon = (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 shrink-0 mt-0.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                  </svg>
                                );
                                alertClass = "border-amber-500/20 bg-amber-500/5 text-amber-400";
                              } else if (isInfo) {
                                icon = (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 shrink-0 mt-0.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063 1.063L12 13.084V15.5h.5a.75.75 0 010 1.5H11a.75.75 0 010-1.5h.5V14a.75.75 0 01-.75-.75V11.25zm.75-3.75h.008v.008H12V7.5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                );
                                alertClass = "border-blue-500/20 bg-blue-500/5 text-blue-400";
                              }
                              
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-xs leading-relaxed ${alertClass}`}
                                >
                                  {icon}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground">{insight.message}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                                      Source: {insight.source}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Operational Timeline ──────────────────────────────────────── */}
          <Card id="timeline-section">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Operational Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No timeline events for this period.</p>
              ) : (
                <div className="relative">
                  {/* Vertical connector line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border/60" />

                  <div className="space-y-0">
                    {timeline.map((event, i) => (
                      <div key={i} className="relative pl-8 pb-6 last:pb-0 group">
                        {/* Dot */}
                        <div className="absolute left-0 top-1 size-[22px] rounded-full border-2 border-border bg-background flex items-center justify-center z-10 group-hover:border-[hsl(210,70%,50%)] transition-colors">
                          <div className={`size-2 rounded-full ${
                            event.vesselCondition?.toUpperCase().includes("BALLAST") ||
                            event.vesselCondition?.toUpperCase().includes("IDLE") ||
                            event.vesselCondition?.toUpperCase().includes("ANCHOR")
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`} />
                        </div>

                        {/* Content */}
                        <div className="rounded-lg border border-border/50 bg-card/50 p-3 hover:bg-card transition-colors">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-sm font-semibold">{fmtTimelineDate(event.date)}</span>
                            {event.vesselCondition && (
                              <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                event.vesselCondition.toUpperCase().includes("BALLAST")
                                  ? "bg-amber-500/10 text-amber-400"
                                  : event.vesselCondition.toUpperCase().includes("LOAD") || event.vesselCondition.toUpperCase().includes("LADEN")
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {event.vesselCondition}
                              </span>
                            )}
                          </div>

                          {(event.latitude || event.longitude) && (
                            <p className="text-xs text-muted-foreground mb-1.5">
                              <span className="text-foreground/70">Position:</span>{" "}
                              {event.latitude ?? "—"} / {event.longitude ?? "—"}
                            </p>
                          )}

                          {event.remarks && (
                            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                              {event.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
