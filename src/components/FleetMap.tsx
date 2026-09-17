import { useEffect, useRef } from 'react';
import * as L from 'leaflet';

import { hasCoordinates, toFiniteNumber } from '../dashboard/filters';
import type { LiveFleetItem } from '../dashboard/types';

type FleetMapProps = {
  items: readonly LiveFleetItem[];
  selectedTripId?: string | null;
  onSelect?: (tripId: string) => void;
};

function markerClass(item: LiveFleetItem, selected: boolean): string {
  const risk = (item.riskLevel ?? 'UNKNOWN').toLowerCase();
  const connection = item.connectionStatus.toLowerCase();
  return `fleet-marker fleet-marker--${risk} fleet-marker--${connection}${selected ? ' fleet-marker--selected' : ''}`;
}

function popupContent(item: LiveFleetItem): HTMLElement {
  const root = document.createElement('div');
  root.className = 'fleet-map-popup';

  const title = document.createElement('strong');
  title.textContent = item.plateNumber || 'Vehicle';
  root.appendChild(title);

  const driver = document.createElement('span');
  driver.textContent = item.driverName || 'Driver unavailable';
  root.appendChild(driver);

  const state = document.createElement('small');
  state.textContent = `${item.riskLevel ?? 'NO RISK SNAPSHOT'} · ${item.connectionStatus}`;
  root.appendChild(state);
  return root;
}

export function FleetMap({ items, selectedTripId, onSelect }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const points: L.LatLngExpression[] = [];
    for (const item of items) {
      if (!hasCoordinates(item)) continue;
      const latitude = toFiniteNumber(item.latitude)!;
      const longitude = toFiniteNumber(item.longitude)!;
      const point: L.LatLngExpression = [latitude, longitude];
      points.push(point);

      const marker = L.marker(point, {
        icon: L.divIcon({
          className: 'safefleet-map-icon',
          html: `<span class="${markerClass(item, selectedTripId === item.tripId)}"></span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        title: `${item.plateNumber} · ${item.driverName}`,
      });
      marker.bindPopup(popupContent(item));
      if (onSelect) marker.on('click', () => onSelect(item.tripId));
      marker.addTo(layer);
    }

    if (points.length === 0) {
      map.setView([0, 0], 2);
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 14 });
    }
  }, [items, onSelect, selectedTripId]);

  return <div className="fleet-map" ref={containerRef} aria-label="Live fleet GPS map" />;
}
