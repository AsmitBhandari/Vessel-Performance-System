import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RoutePosition } from "@/types";

// ── Marker Color Resolver ───────────────────────────────────────────────────

function getConditionColor(condition: string | null): string {
  if (!condition) return "#9ca3af"; // gray
  const upper = condition.toUpperCase();
  if (upper.includes("BALLAST")) return "#3b82f6"; // blue
  if (upper.includes("LOAD") || upper.includes("LADEN")) return "#10b981"; // green
  return "#9ca3af"; // gray
}

function getConditionLabel(condition: string | null): string {
  if (!condition) return "Unknown";
  const upper = condition.toUpperCase();
  if (upper.includes("BALLAST")) return "Ballast";
  if (upper.includes("LOAD") || upper.includes("LADEN")) return "Loaded";
  return condition;
}

// ── Format Date for Popups ──────────────────────────────────────────────────

function fmtPopupDate(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Create DivIcon Markers ──────────────────────────────────────────────────

function createMarkerIcon(
  index: number,
  total: number,
  condition: string | null
): L.DivIcon {
  const isStart = index === 0;
  const isEnd = index === total - 1 && total > 1;

  let bgColor: string;
  let borderColor: string;
  let label: string;
  let flagLabel = "";
  let size = 28;

  if (isStart) {
    bgColor = "#ecfdf5";
    borderColor = "#10b981";
    label = "1";
    flagLabel = "START";
    size = 32;
  } else if (isEnd) {
    bgColor = "#fef2f2";
    borderColor = "#ef4444";
    label = String(index + 1);
    flagLabel = "END";
    size = 32;
  } else {
    bgColor = "#ffffff";
    borderColor = getConditionColor(condition);
    label = String(index + 1);
  }

  const flagHtml = flagLabel
    ? `<div style="
        position:absolute;
        top:-20px;
        left:50%;
        transform:translateX(-50%);
        background:${borderColor};
        color:#fff;
        font-size:9px;
        font-weight:700;
        letter-spacing:0.5px;
        padding:1px 6px;
        border-radius:3px;
        white-space:nowrap;
        line-height:14px;
        box-shadow:0 1px 3px rgba(0,0,0,0.25);
      ">${flagLabel}</div>`
    : "";

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
    html: `
      <div style="
        position:relative;
        width:${size}px;
        height:${size}px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        ${flagHtml}
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${bgColor};
          border:3px solid ${borderColor};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:11px;
          font-weight:700;
          color:${borderColor};
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        ">${label}</div>
      </div>
    `,
  });
}

// ── Popup HTML Builder ──────────────────────────────────────────────────────

function buildPopupHtml(pos: RoutePosition, index: number, total: number): string {
  const isStart = index === 0;
  const isEnd = index === total - 1 && total > 1;
  const tagColor = isStart ? "#10b981" : isEnd ? "#ef4444" : getConditionColor(pos.condition);
  const tagLabel = isStart ? "START" : isEnd ? "END" : "";

  const conditionBadge = pos.condition
    ? `<span style="
        display:inline-block;
        background:${getConditionColor(pos.condition)}22;
        color:${getConditionColor(pos.condition)};
        font-size:10px;
        font-weight:600;
        padding:2px 8px;
        border-radius:10px;
        letter-spacing:0.3px;
        text-transform:uppercase;
      ">${getConditionLabel(pos.condition)}</span>`
    : "";

  const posTag = tagLabel
    ? `<span style="
        display:inline-block;
        background:${tagColor};
        color:#fff;
        font-size:9px;
        font-weight:700;
        padding:2px 6px;
        border-radius:3px;
        letter-spacing:0.5px;
        margin-left:6px;
      ">${tagLabel}</span>`
    : "";

  const coordsHtml =
    pos.latitudeRaw || pos.longitudeRaw
      ? `<div style="font-size:11px;color:#94a3b8;margin-top:6px;">
           <span style="color:#64748b;">📍</span>
           ${pos.latitudeRaw ?? `${pos.latitude.toFixed(4)}`},
           ${pos.longitudeRaw ?? `${pos.longitude.toFixed(4)}`}
         </div>`
      : `<div style="font-size:11px;color:#94a3b8;margin-top:6px;">
           <span style="color:#64748b;">📍</span>
           ${pos.latitude.toFixed(4)}°, ${pos.longitude.toFixed(4)}°
         </div>`;

  const remarksHtml = pos.remarks
    ? `<div style="
        font-size:11px;
        color:#cbd5e1;
        margin-top:8px;
        padding-top:8px;
        border-top:1px solid #334155;
        line-height:1.5;
        word-break:break-word;
      ">${pos.remarks}</div>`
    : "";

  return `
    <div style="
      min-width:200px;
      max-width:280px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    ">
      <div style="
        font-size:14px;
        font-weight:700;
        color:#f1f5f9;
        margin-bottom:6px;
      ">${fmtPopupDate(pos.date)}${posTag}</div>
      ${conditionBadge}
      ${coordsHtml}
      ${remarksHtml}
    </div>
  `;
}

// ── Legend Component ─────────────────────────────────────────────────────────

function createLegendControl(): L.Control {
  const Legend = L.Control.extend({
    options: { position: "bottomright" as L.ControlPosition },
    onAdd: function () {
      const div = L.DomUtil.create("div");
      div.style.cssText = `
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 10px 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 11px;
        color: #94a3b8;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        line-height: 1.6;
      `;
      div.innerHTML = `
        <div style="font-weight:700;color:#e2e8f0;margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;">Legend</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
          <span style="width:12px;height:12px;border-radius:50%;background:#3b82f6;display:inline-block;border:2px solid #3b82f6;"></span>
          Ballast
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
          <span style="width:12px;height:12px;border-radius:50%;background:#10b981;display:inline-block;border:2px solid #10b981;"></span>
          Loaded
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
          <span style="width:12px;height:12px;border-radius:50%;background:#9ca3af;display:inline-block;border:2px solid #9ca3af;"></span>
          Unknown
        </div>
        <div style="border-top:1px solid #334155;margin:6px 0;"></div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
          <span style="width:12px;height:12px;border-radius:50%;background:#ecfdf5;display:inline-block;border:2px solid #10b981;"></span>
          Start
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:12px;height:12px;border-radius:50%;background:#fef2f2;display:inline-block;border:2px solid #ef4444;"></span>
          End
        </div>
      `;
      return div;
    },
  });

  return new Legend();
}

// ── Main RouteMap Component ─────────────────────────────────────────────────

interface RouteMapProps {
  positions: RoutePosition[];
}

export default function RouteMap({ positions }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up any existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    });
    mapInstanceRef.current = map;

    // Dark-styled tile layer (CartoDB Dark Matter)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    if (positions.length === 0) {
      map.setView([20, 80], 4);
      return;
    }

    const latLngs: L.LatLngTuple[] = positions.map((p) => [p.latitude, p.longitude]);

    // Add route polyline
    L.polyline(latLngs, {
      color: "hsl(210, 80%, 60%)",
      weight: 3,
      opacity: 0.7,
      dashArray: "8, 6",
      lineJoin: "round",
    }).addTo(map);

    // Add markers
    positions.forEach((pos, i) => {
      const icon = createMarkerIcon(i, positions.length, pos.condition);
      const marker = L.marker([pos.latitude, pos.longitude], { icon }).addTo(map);

      const popupContent = buildPopupHtml(pos, i, positions.length);
      marker.bindPopup(popupContent, {
        className: "route-popup",
        maxWidth: 300,
        closeButton: true,
      });
    });

    // Add legend
    createLegendControl().addTo(map);

    // Fit bounds with padding
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [positions]);

  return (
    <>
      <style>{`
        .route-popup .leaflet-popup-content-wrapper {
          background: #1e293b;
          color: #e2e8f0;
          border-radius: 10px;
          border: 1px solid #334155;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          padding: 0;
        }
        .route-popup .leaflet-popup-content {
          margin: 12px 14px;
          line-height: 1.5;
        }
        .route-popup .leaflet-popup-tip {
          background: #1e293b;
          border: 1px solid #334155;
          box-shadow: none;
        }
        .route-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
          font-size: 18px !important;
          padding: 4px 8px !important;
        }
        .route-popup .leaflet-popup-close-button:hover {
          color: #f1f5f9 !important;
        }
      `}</style>
      <div
        ref={mapRef}
        id="route-map-container"
        style={{
          width: "100%",
          height: "450px",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid hsl(217, 33%, 17%)",
        }}
      />
    </>
  );
}
