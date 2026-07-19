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
import { supabase } from "@/lib/supabaseClient";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach Supabase access token to every outgoing request
api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error setting auth header", error);
  }
  return config;
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

// ── AI Chat Assistant API ────────────────────────────────────────────────────

import type { ChatSession, ChatMessage } from "@/types";

export async function getChatSessions(): Promise<ChatSession[]> {
  const res = await api.get<Envelope<ChatSession[]>>("/api/chat/sessions");
  return res.data.data;
}

export async function createChatSession(vesselId?: number | null): Promise<ChatSession> {
  const res = await api.post<Envelope<ChatSession>>("/api/chat/sessions", {
    vesselId: vesselId || null,
  });
  return res.data.data;
}

export async function deleteChatSession(sessionId: number): Promise<void> {
  await api.delete(`/api/chat/sessions/${sessionId}`);
}

export async function getChatMessages(sessionId: number): Promise<ChatMessage[]> {
  const res = await api.get<Envelope<ChatMessage[]>>(`/api/chat/sessions/${sessionId}/messages`);
  return res.data.data;
}

export async function sendChatMessage(
  sessionId: number,
  content: string,
  vesselId: number | null,
  callbacks: {
    onChunk: (text: string) => void;
    onInfo: (meta: { vesselId: number | null; startDate: string | null; endDate: string | null; tools: string[] }) => void;
    onDone: () => void;
    onError: (err: string) => void;
  }
): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content, vesselId }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Server error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) {
      throw new Error("Response body is not readable.");
    }

    let buffer = "";
    let hasCalledDone = false;

    while (true) {
      const { value, done } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }

      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || ""; // retain incomplete block

      for (const block of blocks) {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) continue;

        let eventType = "message";
        const dataLines: string[] = [];
        const lines = trimmedBlock.split("\n");
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.replace("event:", "").trim();
          } else if (line.startsWith("data:")) {
            const dataVal = line.substring(5);
            dataLines.push(dataVal.startsWith(" ") ? dataVal.substring(1) : dataVal);
          }
        }
        const dataStr = dataLines.join("\n");

        if (eventType === "chunk") {
          callbacks.onChunk(dataStr);
        } else if (eventType === "info") {
          try {
            callbacks.onInfo(JSON.parse(dataStr));
          } catch (e) {
            console.error("Failed to parse info meta", e);
          }
        } else if (eventType === "done") {
          callbacks.onDone();
          hasCalledDone = true;
        } else if (eventType === "error") {
          callbacks.onError(dataStr);
        }
      }

      if (done) {
        // Decode any remaining data
        const finalChunk = decoder.decode();
        if (finalChunk) {
          buffer += finalChunk;
        }

        const remaining = buffer.trim();
        if (remaining) {
          let eventType = "message";
          const dataLines: string[] = [];
          const lines = remaining.split("\n");
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.replace("event:", "").trim();
            } else if (line.startsWith("data:")) {
              const dataVal = line.substring(5);
              dataLines.push(dataVal.startsWith(" ") ? dataVal.substring(1) : dataVal);
            }
          }
          const dataStr = dataLines.join("\n");

          if (eventType === "chunk") {
            callbacks.onChunk(dataStr);
          } else if (eventType === "info") {
            try {
              callbacks.onInfo(JSON.parse(dataStr));
            } catch (e) {
              console.error("Failed to parse info meta", e);
            }
          } else if (eventType === "done") {
            callbacks.onDone();
            hasCalledDone = true;
          } else if (eventType === "error") {
            callbacks.onError(dataStr);
          }
        }

        if (!hasCalledDone) {
          callbacks.onDone();
        }
        break;
      }
    }
  } catch (err: any) {
    callbacks.onError(err.message || "Connection failed.");
  }
}

export default api;
