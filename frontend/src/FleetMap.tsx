"use client";

import { useEffect, useRef } from "react";
import type { Scooter } from "./types";

interface FleetMapProps {
  scooters: Scooter[];
  compact?: boolean;
}

const markerColors = {
  available: "#0f9f76",
  in_use: "#24b5b0",
  maintenance: "#e6a11a",
  offline: "#8793a3"
} as const;

export default function FleetMap({ scooters, compact = false }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;

    async function mountMap() {
      const L = await import("leaflet");
      if (disposed || !containerRef.current) return;

      map = L.map(containerRef.current, {
        zoomControl: !compact,
        attributionControl: !compact
      }).setView([55.751244, 37.618423], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
      }).addTo(map);

      const bounds: [number, number][] = [];
      scooters.forEach((scooter) => {
        const point: [number, number] = [
          scooter.latitude,
          scooter.longitude
        ];
        bounds.push(point);
        L.circleMarker(point, {
          radius: compact ? 7 : 9,
          color: "#ffffff",
          weight: 3,
          fillColor: markerColors[scooter.status],
          fillOpacity: 1
        })
          .bindPopup(
            `<strong>${scooter.number}</strong><br>${scooter.model}<br>Заряд: ${scooter.batteryLevel}%`
          )
          .addTo(map!);
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
      }
    }

    void mountMap();
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [compact, scooters]);

  return (
    <div
      className={compact ? "fleet-map fleet-map--compact" : "fleet-map"}
      ref={containerRef}
      aria-label="Карта расположения самокатов"
    />
  );
}
