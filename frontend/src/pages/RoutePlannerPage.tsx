import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPorts, planRoute } from "@/services/api";
import type { PortInfo, PlannedRouteInfo, RoutePlanResult } from "@/types";
import PlannedRouteMap from "@/components/PlannedRouteMap";

export default function RoutePlannerPage() {
  // Ports state
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [originId, setOriginId] = useState<string>("");
  const [destinationId, setDestinationId] = useState<string>("");

  // Route Planning state
  const [planResult, setPlanResult] = useState<RoutePlanResult | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<PlannedRouteInfo | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<PlannedRouteInfo[]>([]);

  // UI state
  const [loadingPorts, setLoadingPorts] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWaypoints, setShowWaypoints] = useState(false);

  // Load ports list on mount
  useEffect(() => {
    getPorts()
      .then((data) => {
        setPorts(data);
        if (data.length > 0) {
          // Pre-populate default ports if available (e.g. Singapore and Mumbai)
          const sg = data.find((p) => p.name.toLowerCase().includes("singapore"));
          const bom = data.find((p) => p.name.toLowerCase().includes("mumbai"));
          if (sg) setOriginId(String(sg.id));
          if (bom) setDestinationId(String(bom.id));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch ports", err);
        setError("Could not load port list. Please verify the backend service is running.");
      })
      .finally(() => setLoadingPorts(false));
  }, []);

  // Run Route Planning recommendation
  const runPlanning = useCallback(async () => {
    if (!originId || !destinationId) return;
    if (originId === destinationId) {
      setError("Origin and Destination ports must be different.");
      setPlanResult(null);
      setSelectedRoute(null);
      setAlternativeRoutes([]);
      return;
    }

    setPlanning(true);
    setError(null);
    setShowWaypoints(false);

    try {
      const res = await planRoute(Number(originId), Number(destinationId));
      setPlanResult(res);

      if (res.recommendedRoute) {
        setSelectedRoute(res.recommendedRoute);
        setAlternativeRoutes(res.alternativeRoutes);
      } else {
        setSelectedRoute(null);
        setAlternativeRoutes([]);
      }
    } catch (err: any) {
      console.error("Failed to plan route", err);
      setError(err?.response?.data?.message || "An error occurred while generating route recommendation.");
      setPlanResult(null);
      setSelectedRoute(null);
      setAlternativeRoutes([]);
    } finally {
      setPlanning(false);
    }
  }, [originId, destinationId]);

  // Trigger planning when selection changes
  useEffect(() => {
    if (originId && destinationId) {
      runPlanning();
    } else {
      setPlanResult(null);
      setSelectedRoute(null);
      setAlternativeRoutes([]);
    }
  }, [originId, destinationId, runPlanning]);

  // Swap origin and destination ports
  const swapPorts = () => {
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
  };

  // Handle route selection changes (from map clicks or details panel lists)
  const handleSelectRoute = (route: PlannedRouteInfo) => {
    if (!planResult) return;

    // Switch selected and recompile alternatives
    const all = [planResult.recommendedRoute, ...planResult.alternativeRoutes].filter(
      (r): r is PlannedRouteInfo => r !== null
    );

    setSelectedRoute(route);
    setAlternativeRoutes(all.filter((r) => r.id !== route.id));
  };

  // Weather risk level badge styling
  const getWeatherRiskBadge = (risk: string) => {
    const cleanRisk = risk.toLowerCase();
    if (cleanRisk === "low") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          🟢 Low Risk
        </span>
      );
    } else if (cleanRisk === "medium" || cleanRisk === "mod" || cleanRisk === "moderate") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          🟡 Moderate
        </span>
      );
    } else if (cleanRisk === "high" || cleanRisk === "severe") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          🔴 High Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
        ⚪ Not Assessed
      </span>
    );
  };

  const getOriginPort = () => ports.find((p) => String(p.id) === originId) || null;
  const getDestinationPort = () => ports.find((p) => String(p.id) === destinationId) || null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ── Header Section ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Historical Route Recommendation</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-[800px]">
            Consult verified shipping corridor configurations based on historical noon report position records and Admiralty Distance logs. Direct coordinates represent actual corridors instead of simple geometric calculations.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border/30 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-full bg-blue-500 animate-pulse"></span>
          Historical Database Mode
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* ── Main Dashboard Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Controls and Details (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Port selection */}
          <Card className="border-border/40 bg-card/65 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Route Selector</CardTitle>
              <CardDescription className="text-xs">
                Select Origin and Destination ports to retrieve recommendation corridors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
                {/* Origin */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    Origin Port
                  </label>
                  <select
                    value={originId}
                    onChange={(e) => setOriginId(e.target.value)}
                    disabled={loadingPorts}
                    className="w-full h-9 rounded-lg border border-border/50 bg-background/50 px-2.5 py-1 text-xs outline-none focus:border-primary/65 transition-all"
                  >
                    <option value="" disabled>Select port...</option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap button */}
                <div className="flex justify-center pt-5 sm:pt-4">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={swapPorts}
                    disabled={loadingPorts || !originId || !destinationId}
                    title="Swap ports"
                    className="size-7 rounded-full hover:bg-muted"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-3.5 rotate-90 sm:rotate-0 transition-transform duration-300"
                    >
                      <path d="m17 2 4 4-4 4" />
                      <path d="M3 18v-6a6 6 0 0 1 12-6h6" />
                      <path d="m7 22-4-4 4-4" />
                      <path d="M21 6v6a6 6 0 0 1-12 6H3" />
                    </svg>
                  </Button>
                </div>

                {/* Destination */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    Destination Port
                  </label>
                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    disabled={loadingPorts}
                    className="w-full h-9 rounded-lg border border-border/50 bg-background/50 px-2.5 py-1 text-xs outline-none focus:border-primary/65 transition-all"
                  >
                    <option value="" disabled>Select port...</option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planning Loader */}
          {planning && (
            <Card className="border-border/40 py-8 flex flex-col items-center justify-center gap-3 bg-card/65">
              <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
              <div className="text-xs text-muted-foreground font-medium">Retrieving route recommendations...</div>
            </Card>
          )}

          {/* Recommendation Info Details */}
          {!planning && selectedRoute && (
            <div className="space-y-6">
              {/* Card: Primary Recommended details */}
              <Card className="border-border/40 bg-card/65 shadow-sm border-l-4 border-l-blue-500 overflow-visible">
                <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {selectedRoute.routeType}
                      </span>
                      {planResult?.recommendedRoute && selectedRoute.id === planResult.recommendedRoute.id ? (
                        <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                          🏆 Recommended
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-500/10 text-slate-400 px-1.5 py-0.5 rounded border border-slate-500/20">
                          Alternative
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold mt-2">{selectedRoute.routeName}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Operational summary and default historical metadata.
                    </CardDescription>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    {selectedRoute.score !== undefined && (
                      <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 rounded-full mb-2">
                        <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Score</span>
                        <span className="text-sm font-extrabold text-foreground tabular-nums">{selectedRoute.score}</span>
                      </div>
                    )}
                    <span className="text-2xl font-black tabular-nums tracking-tight text-foreground block leading-none">
                      {selectedRoute.distanceNm.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-1 block">
                      Distance (NM)
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4 border-y border-border/30 py-3 text-xs">
                    {/* Data Source & Provenance */}
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">
                        Source
                      </span>
                      <span className="font-medium text-foreground capitalize mt-0.5 block">
                        {selectedRoute.dataSource?.replace(/_/g, " ") || "Historical Logs"}
                      </span>
                    </div>
                    {/* Confidence score */}
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">
                        Confidence
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(selectedRoute.confidence || 0.5) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold tabular-nums text-foreground">
                          {Math.round((selectedRoute.confidence || 0.5) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-1 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">
                        Weather Risk
                      </span>
                      <div className="mt-1">{getWeatherRiskBadge(selectedRoute.weatherRisk)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">
                        Est. Fuel
                      </span>
                      <span className="font-bold text-foreground block mt-1">
                        {selectedRoute.fuelEstimateMt ? `${selectedRoute.fuelEstimateMt.toFixed(1)} MT` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">
                        Reliability
                      </span>
                      <span className="font-bold text-foreground block mt-1">
                        {selectedRoute.historicalSuccessRate !== null ? `${selectedRoute.historicalSuccessRate.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Score Breakdown Section */}
                  {selectedRoute.scoreBreakdown && (
                    <div className="border-t border-border/30 pt-3.5 space-y-2">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                        Score Breakdown
                      </span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Distance</span>
                            <span className="font-semibold tabular-nums text-foreground">{selectedRoute.scoreBreakdown.distance}</span>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedRoute.scoreBreakdown.distance}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Weather</span>
                            <span className="font-semibold tabular-nums text-foreground">{selectedRoute.scoreBreakdown.weather}</span>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedRoute.scoreBreakdown.weather}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Fuel Efficiency</span>
                            <span className="font-semibold tabular-nums text-foreground">{selectedRoute.scoreBreakdown.fuel}</span>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedRoute.scoreBreakdown.fuel}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Reliability</span>
                            <span className="font-semibold tabular-nums text-foreground">{selectedRoute.scoreBreakdown.reliability}</span>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedRoute.scoreBreakdown.reliability}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Waypoints Collapsible Section */}
                  {selectedRoute.waypoints && selectedRoute.waypoints.length > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => setShowWaypoints(!showWaypoints)}
                        className="w-full flex items-center justify-between py-1.5 px-2 bg-muted/30 border border-border/30 hover:bg-muted/50 rounded-lg text-xs font-semibold text-foreground transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          📍 {selectedRoute.waypoints.length} Route Waypoints
                        </span>
                        <span>{showWaypoints ? "▼" : "▶"}</span>
                      </button>

                      {showWaypoints && (
                        <div className="mt-2 max-h-[140px] overflow-y-auto rounded-lg border border-border/30 bg-muted/15 p-2 space-y-1 scrollbar-thin">
                          {selectedRoute.waypoints.map((wp, idx) => {
                            let label = `Waypoint ${idx}`;
                            if (idx === 0) label = `Origin (${getOriginPort()?.name || "Start"})`;
                            if (idx === (selectedRoute.waypoints?.length || 0) - 1)
                              label = `Destination (${getDestinationPort()?.name || "End"})`;

                            return (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-[11px] py-1 border-b border-border/10 last:border-0 hover:bg-muted/10 px-1 rounded"
                              >
                                <span className="text-muted-foreground font-medium">{label}</span>
                                <span className="font-mono tabular-nums text-foreground/80">
                                  {wp.lat.toFixed(4)}°, {wp.lon.toFixed(4)}°
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generated Time stamp */}
                  {planResult?.generatedAt && (
                    <div className="text-[10px] text-muted-foreground text-right border-t border-border/15 pt-2 mt-2 font-mono">
                      Generated: {new Date(planResult.generatedAt).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Why Recommended Explanation Panel */}
              {planResult?.recommendationReasons &&
               planResult.recommendationReasons.length > 0 &&
               planResult.recommendedRoute &&
               selectedRoute.id === planResult.recommendedRoute.id && (
                <Card className="border-border/40 bg-card/65 shadow-sm border-l-4 border-l-emerald-500">
                  <CardHeader className="pb-2.5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Why Recommended?
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Deterministic audit checklist explaining the recommendation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-xs pb-3.5">
                    {planResult.recommendationReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-foreground/90 leading-tight">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Alternative Routes list */}
              {alternativeRoutes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                    Alternative Historical Corridors
                  </h3>
                  <div className="space-y-2">
                    {alternativeRoutes.map((route) => (
                      <div
                        key={route.id}
                        onClick={() => handleSelectRoute(route)}
                        className="group flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/40 cursor-pointer transition-all hover:border-border"
                      >
                        <div>
                          <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            {route.routeName}
                            {route.score !== undefined && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/30 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                Score: {route.score}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Success: {route.historicalSuccessRate !== null ? `${route.historicalSuccessRate}%` : "—"} • Weather: {route.weatherRisk}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold tabular-nums text-foreground">
                            {route.distanceNm} NM
                          </span>
                          <span className="block text-[8px] text-muted-foreground font-medium uppercase tracking-wider">
                            Corridor Distance
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No route found fallback view */}
          {!planning && originId && destinationId && !selectedRoute && (
            <Card className="border-dashed border-border/70 bg-muted/10 py-6 px-4 text-center rounded-xl">
              <div className="text-base text-amber-500 mb-2">⚠️ No Historical Corridors Available</div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[340px] mx-auto">
                There are no established historical routes recorded between these ports. The map will display a geodesic straight line for reference.
              </p>
            </Card>
          )}

          {/* Prompt to select ports */}
          {!originId || !destinationId ? (
            <Card className="border border-border/30 bg-muted/5 py-12 px-4 text-center rounded-xl">
              <div className="size-10 rounded-full bg-muted/40 border border-border/30 flex items-center justify-center mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 text-muted-foreground"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                Awaiting Inputs
              </div>
              <p className="text-[11px] text-muted-foreground/80 max-w-[280px] mx-auto">
                Configure both origin and destination ports above to fetch historical shipping routing recommendations.
              </p>
            </Card>
          ) : null}
        </div>

        {/* Right Side: Map Display (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border/40 overflow-hidden bg-card/65 shadow-md">
            <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Interactive Operations Map</CardTitle>
                <CardDescription className="text-xs">
                  Visual representation of the selected historical shipping track.
                </CardDescription>
              </div>
              {selectedRoute && (
                <div className="text-xs font-semibold px-2.5 py-1 bg-muted/40 border border-border/30 rounded text-foreground">
                  📈 {selectedRoute.routeName} ({selectedRoute.distanceNm} NM)
                </div>
              )}
            </CardHeader>
            <div className="p-1.5 relative">
              <PlannedRouteMap
                origin={getOriginPort()}
                destination={getDestinationPort()}
                selectedRoute={selectedRoute}
                alternativeRoutes={alternativeRoutes}
                onSelectRoute={handleSelectRoute}
              />
            </div>
          </Card>

          {/* Map Explainer legend note */}
          <div className="flex items-start gap-2.5 text-[11px] text-muted-foreground bg-muted/15 border border-border/20 p-3 rounded-lg">
            <span className="text-xs">ℹ️</span>
            <p className="leading-normal">
              <strong>Corridor Interaction:</strong> Solid blue lines represent the active recommended track. Dotted gray lines show alternative paths. Hovering over alternatives highlights them in cyan; clicking a route updates the operational metrics and details.
            </p>
          </div>
        </div>

        {/* ── Route Comparison Table (Full Width 12-Columns below columns) ───── */}
        {planResult && !planning && (
          <div className="col-span-1 lg:col-span-12 mt-2">
            <Card className="border-border/40 bg-card/65 shadow-md overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-sm font-semibold">Route Comparison Table</CardTitle>
                <CardDescription className="text-xs">
                  Auditable comparison of all historical shipping corridors between the selected ports.
                </CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/25 text-muted-foreground/80">
                      <th className="p-3 font-semibold">Corridor Status</th>
                      <th className="p-3 font-semibold">Route Name</th>
                      <th className="p-3 font-semibold">Distance</th>
                      <th className="p-3 font-semibold">Weather Risk</th>
                      <th className="p-3 font-semibold">Est. Fuel</th>
                      <th className="p-3 font-semibold text-right">Reliability</th>
                      <th className="p-3 font-semibold text-right">Composite Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...(planResult.recommendedRoute ? [planResult.recommendedRoute] : []),
                      ...planResult.alternativeRoutes,
                    ]
                      .sort((a, b) => (b.score || 0) - (a.score || 0))
                      .map((route) => {
                        const isRecommended = planResult.recommendedRoute && route.id === planResult.recommendedRoute.id;
                        const isSelected = selectedRoute && route.id === selectedRoute.id;

                        return (
                          <tr
                            key={route.id}
                            onClick={() => handleSelectRoute(route)}
                            className={`border-b border-border/20 hover:bg-muted/30 cursor-pointer transition-colors ${
                              isSelected ? "bg-muted/15 font-medium" : ""
                            }`}
                          >
                            <td className="p-3">
                              {isRecommended ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                  🏆 Recommended
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Alternative
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-foreground font-semibold">
                              {route.routeName}
                            </td>
                            <td className="p-3 tabular-nums">{route.distanceNm.toLocaleString()} NM</td>
                            <td className="p-3 text-foreground">
                              {route.weatherRisk}
                            </td>
                            <td className="p-3 tabular-nums text-foreground">
                              {route.fuelEstimateMt ? `${route.fuelEstimateMt.toFixed(1)} MT` : "—"}
                            </td>
                            <td className="p-3 text-right tabular-nums text-foreground">
                              {route.historicalSuccessRate !== null ? `${route.historicalSuccessRate.toFixed(1)}%` : "—"}
                            </td>
                            <td className="p-3 text-right tabular-nums font-bold text-foreground">
                              {route.score ?? "—"} <span className="text-[10px] text-muted-foreground font-normal">/ 100</span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
