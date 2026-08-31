import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Severity } from '@/types/db';

interface MapPin {
  lat: number;
  lng: number;
  village: string;
  block: string;
  district: string;
  count: number;
  severity: Severity;
  species: string;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  'low': '#5a943c',
  'medium': '#e4a017',
  'high': '#d9612f',
  'outbreak-risk': '#c2362b',
};

// Custom div-icon markers sized by case count, colored by severity
function createIcon(pin: MapPin): L.DivIcon {
  const size = Math.min(18 + pin.count * 4, 44);
  const color = SEVERITY_COLORS[pin.severity];
  const pulse = pin.severity === 'outbreak-risk' ? 'animation: pulse-soft 2s infinite;' : '';

  return L.divIcon({
    className: 'jeevsetu-map-pin',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:${size > 28 ? '13px' : '11px'};
      ${pulse}
    ">${pin.count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function LeafletMap({ pins, center }: { pins: MapPin[]; center?: [number, number] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = center ?? [16.989, 82.243];
    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: 10,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // Fix: ensure map renders correctly after container is visible
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  // Update markers when pins change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng], { icon: createIcon(pin) });
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:140px;">
          <div style="font-weight:700;font-size:13px;color:#2b2925;margin-bottom:2px;">${pin.village}</div>
          <div style="font-size:11px;color:#827b6f;margin-bottom:6px;">${pin.block}, ${pin.district}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${SEVERITY_COLORS[pin.severity]};"></span>
            <span style="font-size:12px;font-weight:600;color:${SEVERITY_COLORS[pin.severity]};text-transform:capitalize;">${pin.severity.replace('-', ' ')}</span>
          </div>
          <div style="font-size:12px;color:#524e47;">${pin.count} active case${pin.count > 1 ? 's' : ''} · ${pin.species}</div>
        </div>
      `);
      marker.addTo(map);
      markersRef.current.push(marker);
    }

    // Fit bounds if we have pins
    if (pins.length > 0) {
      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds.pad(0.2));
    }
  }, [pins]);

  return <div ref={containerRef} className="w-full h-full rounded-2xl" style={{ minHeight: '400px' }} />;
}
