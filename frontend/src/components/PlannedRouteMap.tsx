import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PortInfo, PlannedRouteInfo } from "@/types";

interface PlannedRouteMapProps {
  origin: PortInfo | null;
  destination: PortInfo | null;
  selectedRoute: PlannedRouteInfo | null;
  alternativeRoutes: PlannedRouteInfo[];
  onSelectRoute?: (route: PlannedRouteInfo) => void;
}

// ── Custom Marker Builders ───────────────────────────────────────────────────

function createPortIcon(label: "A" | "B"): L.DivIcon {
  const color = label === "A" ? "#10b981" : "#ef4444"; // Green for Origin, Red for Destination
  const bgColor = label === "A" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";
  const pulseColor = label === "A" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)";

  return L.divIcon({
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Pulse Wave -->
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid ${color};
          animation: map-pulse 2s infinite ease-out;
          opacity: 0;
          pointer-events: none;
        "></div>
        <!-- Inner Core -->
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${bgColor};
          border: 3px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: ${color};
          box-shadow: 0 0 12px ${pulseColor};
          font-family: ui-sans-serif, system-ui, sans-serif;
          backdrop-filter: blur(2px);
        ">${label}</div>
      </div>
    `,
  });
}

function createWaypointIcon(index: number): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6],
    html: `
      <div style="
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #1e293b;
        border: 2px solid #64748b;
        box-shadow: 0 0 4px rgba(0,0,0,0.5);
      " title="Waypoint ${index}"></div>
    `,
  });
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PlannedRouteMap({
  origin,
  destination,
  selectedRoute,
  alternativeRoutes,
  onSelectRoute,
}: PlannedRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up any existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    });
    mapInstanceRef.current = map;

    // Dark theme CartoDB tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Default view when no ports selected
    if (!origin && !destination) {
      map.setView([20, 40], 3);
      return;
    }

    const boundsLatLngs: L.LatLngTuple[] = [];

    // ── Render Origin Port Marker ─────────────────────────────────────────────
    if (origin) {
      const originLatLng: L.LatLngTuple = [origin.latitude, origin.longitude];
      boundsLatLngs.push(originLatLng);

      const marker = L.marker(originLatLng, {
        icon: createPortIcon("A"),
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #f1f5f9; min-width: 140px;">
          <div style="font-weight: 700; font-size: 13px; color: #10b981; margin-bottom: 2px;">Origin Port</div>
          <div style="font-weight: 600;">${origin.name} (${origin.code})</div>
          <div style="color: #94a3b8; margin-top: 4px;">${origin.country}</div>
          <div style="color: #64748b; font-size: 10px; margin-top: 4px;">
            ${origin.latitude.toFixed(4)}°, ${origin.longitude.toFixed(4)}°
          </div>
        </div>
      `, { className: "planned-route-popup" });
    }

    // ── Render Destination Port Marker ────────────────────────────────────────
    if (destination) {
      const destLatLng: L.LatLngTuple = [destination.latitude, destination.longitude];
      boundsLatLngs.push(destLatLng);

      const marker = L.marker(destLatLng, {
        icon: createPortIcon("B"),
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #f1f5f9; min-width: 140px;">
          <div style="font-weight: 700; font-size: 13px; color: #ef4444; margin-bottom: 2px;">Destination Port</div>
          <div style="font-weight: 600;">${destination.name} (${destination.code})</div>
          <div style="color: #94a3b8; margin-top: 4px;">${destination.country}</div>
          <div style="color: #64748b; font-size: 10px; margin-top: 4px;">
            ${destination.latitude.toFixed(4)}°, ${destination.longitude.toFixed(4)}°
          </div>
        </div>
      `, { className: "planned-route-popup" });
    }

    // ── Render Routes ─────────────────────────────────────────────────────────
    const allRoutes = [
      ...(selectedRoute ? [selectedRoute] : []),
      ...alternativeRoutes,
    ];

    allRoutes.forEach((route) => {
      const isSelected = selectedRoute && route.id === selectedRoute.id;

      // Extract path coords
      let latLngs: L.LatLngTuple[] = [];
      if (route.waypoints && route.waypoints.length > 0) {
        latLngs = route.waypoints.map((wp) => [wp.lat, wp.lon]);
      } else if (origin && destination) {
        latLngs = [
          [origin.latitude, origin.longitude],
          [destination.latitude, destination.longitude],
        ];
      }

      if (latLngs.length === 0) return;

      // Add to bounds mapping to include intermediate waypoint curves
      latLngs.forEach((coord) => boundsLatLngs.push(coord));

      // Style active vs alternative lines
      const color = isSelected ? "#3b82f6" : "#475569"; // blue vs slate
      const weight = isSelected ? 4 : 2;
      const opacity = isSelected ? 0.9 : 0.45;
      const dashArray = isSelected ? undefined : "6, 6";

      const polyline = L.polyline(latLngs, {
        color,
        weight,
        opacity,
        dashArray,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Interactive hover styles
      polyline.on("mouseover", () => {
        if (!isSelected) {
          polyline.setStyle({
            color: "#67e8f9", // bright cyan on hover
            opacity: 0.8,
            weight: 3,
          });
        }
      });

      polyline.on("mouseout", () => {
        if (!isSelected) {
          polyline.setStyle({
            color: "#475569",
            opacity: 0.45,
            weight: 2,
          });
        }
      });

      // Selection click handler
      if (onSelectRoute) {
        polyline.on("click", () => {
          onSelectRoute(route);
        });
      }

      // Add waypoints as tiny markers for the selected route only
      if (isSelected && route.waypoints && route.waypoints.length > 2) {
        // Skip first and last waypoints since the large ports overlap them
        for (let i = 1; i < route.waypoints.length - 1; i++) {
          const wp = route.waypoints[i];
          const wpMarker = L.marker([wp.lat, wp.lon], {
            icon: createWaypointIcon(i),
          }).addTo(map);

          wpMarker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 11px; color: #cbd5e1; padding: 2px;">
              <span style="font-weight:700; color:#3b82f6;">Waypoint ${i}</span>
              <div style="margin-top: 4px; color:#94a3b8; font-size:10px;">
                ${wp.lat.toFixed(4)}°, ${wp.lon.toFixed(4)}°
              </div>
            </div>
          `, { className: "planned-route-popup", closeButton: false });
        }
      }
    });

    // Fit bounds with padding
    if (boundsLatLngs.length > 0) {
      const bounds = L.latLngBounds(boundsLatLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [origin, destination, selectedRoute, alternativeRoutes, onSelectRoute]);

  return (
    <>
      <style>{`
        /* Map pulse animation */
        @keyframes map-pulse {
          0% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }

        /* Leaflet popup customization */
        .planned-route-popup .leaflet-popup-content-wrapper {
          background: #0f172a; /* Slate 900 */
          color: #e2e8f0;
          border-radius: 8px;
          border: 1px solid #1e293b; /* Slate 800 */
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          padding: 0;
        }
        .planned-route-popup .leaflet-popup-content {
          margin: 10px 12px;
          line-height: 1.4;
        }
        .planned-route-popup .leaflet-popup-tip {
          background: #0f172a;
          border: 1px solid #1e293b;
        }
      `}</style>
      <div
        ref={mapRef}
        id="planned-route-map-container"
        className="w-full h-[500px] rounded-xl overflow-hidden border border-border/40 shadow-inner relative z-10"
      />
    </>
  );
}
