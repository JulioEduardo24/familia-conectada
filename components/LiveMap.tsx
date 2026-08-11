"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_COLOR, STATUS_LABEL, type FamilyMember, type StatusValue } from "@/lib/types";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function memberIcon(color: string, name: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position: relative; width: 22px; height: 22px;">
        <div style="
          width: 22px; height: 22px; border-radius: 9999px;
          background: ${color}; border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        "></div>
        <div style="
          position: absolute; top: 26px; left: 50%; transform: translateX(-50%);
          white-space: nowrap; background: white; color: #18181b;
          font-size: 11px; font-weight: 600; padding: 2px 7px;
          border-radius: 9999px; box-shadow: 0 1px 3px rgba(0,0,0,0.35);
        ">${escapeHtml(name)}</div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function timeAgo(iso: string | null) {
  if (!iso) return "sin actualizar";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "hace instantes";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} d`;
}

const DEFAULT_CENTER: [number, number] = [-12.0464, -77.0428]; // Lima, Perú
const DEFAULT_ZOOM = 12;

const LEGEND_ITEMS: StatusValue[] = ["bien", "ayuda", "sin_noticias"];

function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border border-zinc-200 bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
      <p className="mb-1.5 font-semibold text-zinc-500 dark:text-zinc-400">Leyenda</p>
      <div className="flex flex-col gap-1">
        {LEGEND_ITEMS.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: STATUS_COLOR[s] }}
            />
            <span className="text-zinc-700 dark:text-zinc-300">{STATUS_LABEL[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LiveMap() {
  const { members } = useFamilyMembers();

  const located = useMemo(
    () => members.filter((m): m is FamilyMember & { lat: number; lng: number } =>
      m.lat != null && m.lng != null
    ),
    [members]
  );

  return (
    <div className="flex flex-col gap-3">
      {located.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Nadie ha compartido su ubicación GPS todavía. Ve a la pestaña &quot;Tablero&quot; y
          presiona &quot;Compartir GPS&quot;.
        </p>
      )}
      <div className="relative h-[60vh] w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {located.map((m) => (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={memberIcon(STATUS_COLOR[m.status], m.full_name)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{m.full_name}</p>
                  <p>{STATUS_LABEL[m.status]}</p>
                  {m.message && <p className="mt-1">{m.message}</p>}
                  <p className="mt-1 text-xs text-zinc-500">{timeAgo(m.updated_at)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <MapLegend />
      </div>
    </div>
  );
}
