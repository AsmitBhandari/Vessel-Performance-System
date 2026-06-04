import axios from "axios";
import type {
  UploadResponse,
  IngestionResponse,
  VesselInfo,
  ReportsSummary,
  DashboardPayload,
  FuelTrendPoint,
  SpeedTrendPoint,
  WeatherTrendPoint,
  TimelineEvent,
  Envelope,
  OperationalInsight,
  RouteDataPayload,
  PortInfo,
  RoutePlanResult,
} from "@/types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ── Upload (Phase 1 — preserved) ────────────────────────────────────────────

export async function uploadReport(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<UploadResponse>("/api/upload-report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ── Ingest (Phase 3A — parse + persist) ─────────────────────────────────────

export async function ingestReport(file: File): Promise<IngestionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<IngestionResponse>("/api/ingest-report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ── Vessels ──────────────────────────────────────────────────────────────────

export async function getVessels(): Promise<VesselInfo[]> {
  const res = await api.get<Envelope<VesselInfo[]>>("/api/vessels");
  return res.data.data;
}

// ── Reports Summary ─────────────────────────────────────────────────────────

export async function getReportsSummary(): Promise<ReportsSummary> {
  const res = await api.get<Envelope<ReportsSummary>>("/api/reports/summary");
  return res.data.data;
}

// ── Dashboard (comprehensive vessel analytics) ──────────────────────────────

export async function getVesselDashboard(
  vesselId: number,
  startDate?: string,
  endDate?: string,
  severeThreshold?: number
): Promise<DashboardPayload> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (severeThreshold !== undefined)
    params.severeWeatherThreshold = severeThreshold.toString();

  const res = await api.get<Envelope<DashboardPayload>>(
    `/api/analytics/vessel/${vesselId}`,
    { params }
  );
  return res.data.data;
}

// ── Trends ──────────────────────────────────────────────────────────────────

export async function getFuelTrend(
  vesselName: string,
  startDate?: string,
  endDate?: string
): Promise<FuelTrendPoint[]> {
  const params: Record<string, string> = { vesselName };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const res = await api.get<Envelope<FuelTrendPoint[]>>(
    "/api/analytics/trends/fuel",
    { params }
  );
  return res.data.data;
}

export async function getSpeedTrend(
  vesselName: string,
  startDate?: string,
  endDate?: string
): Promise<SpeedTrendPoint[]> {
  const params: Record<string, string> = { vesselName };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const res = await api.get<Envelope<SpeedTrendPoint[]>>(
    "/api/analytics/trends/speed",
    { params }
  );
  return res.data.data;
}

export async function getWeatherTrend(
  vesselName: string,
  startDate?: string,
  endDate?: string
): Promise<WeatherTrendPoint[]> {
  const params: Record<string, string> = { vesselName };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const res = await api.get<Envelope<WeatherTrendPoint[]>>(
    "/api/analytics/trends/weather",
    { params }
  );
  return res.data.data;
}

// ── Timeline ────────────────────────────────────────────────────────────────

export async function getTimeline(
  vesselName: string,
  startDate?: string,
  endDate?: string
): Promise<TimelineEvent[]> {
  const params: Record<string, string> = { vesselName };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const res = await api.get<Envelope<TimelineEvent[]>>(
    "/api/analytics/timeline",
    { params }
  );
  return res.data.data;
}

export async function getOperationalInsights(
  vesselName: string,
  startDate?: string,
  endDate?: string,
  severeThreshold?: number
): Promise<OperationalInsight[]> {
  const params: Record<string, string> = { vesselName };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (severeThreshold !== undefined)
    params.severeWeatherThreshold = severeThreshold.toString();

  const res = await api.get<Envelope<OperationalInsight[]>>(
    "/api/analytics/insights",
    { params }
  );
  return res.data.data;
}

// ── Route Positions ─────────────────────────────────────────────────────

export async function getRoutePositions(
  vesselName: string,
  startDate?: string,
  endDate?: string
): Promise<RouteDataPayload> {
  const params: Record<string, string> = { vesselName };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await api.get<Envelope<RouteDataPayload>>("/api/routes/positions", { params });
  return res.data.data;
}

// ── Route Planner (Phase 7A — Historical Route Based) ──────────────────────────

export async function getPorts(): Promise<PortInfo[]> {
  const res = await api.get<Envelope<PortInfo[]>>("/api/ports");
  return res.data.data;
}

export async function planRoute(
  originPortId: number,
  destinationPortId: number
): Promise<RoutePlanResult> {
  const res = await api.post<Envelope<RoutePlanResult>>("/api/route-planner/plan", {
    originPortId,
    destinationPortId,
  });
  return res.data.data;
}

export default api;
