"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  STATUS_COLOR,
  STATUS_ICON,
  STATUS_LABEL,
  type FamilyMember,
  type StatusValue,
} from "@/lib/types";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import LocationPinIcon from "@/components/icons/LocationPinIcon";

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

export default function StatusBoard({ userId }: { userId: string }) {
  const { members, loading } = useFamilyMembers();
  const me = useMemo(() => members.find((m) => m.id === userId), [members, userId]);
  const others = useMemo(() => members.filter((m) => m.id !== userId), [members, userId]);

  return (
    <div className="flex flex-col gap-6">
      {me && <MyStatusEditor member={me} />}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Familia ({others.length})
        </h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Cargando...</p>
        ) : others.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Todavía no hay más familiares registrados. Comparte el enlace y el código de
            invitación.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {others.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: FamilyMember }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-50">
          {member.full_name}
        </span>
        <span
          className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: STATUS_COLOR[member.status] }}
        >
          <span>{STATUS_ICON[member.status]}</span>
          {STATUS_LABEL[member.status]}
        </span>
      </div>
      {member.message && (
        <p className="mt-2 break-words text-sm text-zinc-600 dark:text-zinc-400">
          {member.message}
        </p>
      )}
      {member.location_text && (
        <p className="mt-1 flex items-start gap-1 break-words text-xs text-zinc-500">
          <LocationPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {member.location_text}
        </p>
      )}
      <p className="mt-2 text-xs text-zinc-400">{timeAgo(member.updated_at)}</p>
    </div>
  );
}

function MyStatusEditor({ member }: { member: FamilyMember }) {
  const [status, setStatus] = useState<StatusValue>(member.status);
  const [message, setMessage] = useState(member.message ?? "");
  const [locationText, setLocationText] = useState(member.location_text ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  async function save(overrides?: { lat?: number; lng?: number }) {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase
      .from("statuses")
      .update({
        status,
        message: message.trim() || null,
        location_text: locationText.trim() || null,
        ...overrides,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", member.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function shareGpsLocation() {
    if (!navigator.geolocation) {
      alert("Este navegador no soporta geolocalización.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoLoading(false);
        await save({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setGeoLoading(false);
        alert("No se pudo obtener tu ubicación GPS. Revisa los permisos del navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Mi estado</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(STATUS_LABEL) as StatusValue[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`min-h-[44px] touch-manipulation rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 ${
              status === s ? "opacity-100" : "opacity-40"
            }`}
            style={{ backgroundColor: STATUS_COLOR[s] }}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Mensaje corto para tu familia (opcional)"
        rows={2}
        className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base outline-none transition-colors focus:border-zinc-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="Dónde estás (ej. Miraflores, Lima)"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2.5 text-base outline-none transition-colors focus:border-zinc-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="button"
          onClick={shareGpsLocation}
          disabled={geoLoading}
          className="flex min-h-[44px] touch-manipulation items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 active:scale-95 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {geoLoading ? (
            "Ubicando..."
          ) : (
            <>
              <LocationPinIcon className="h-4 w-4 shrink-0" />
              Compartir GPS
            </>
          )}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save()}
          disabled={saving}
          className="min-h-[44px] w-full touch-manipulation rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-60 sm:w-auto dark:bg-white dark:text-zinc-900"
        >
          {saving ? "Guardando..." : "Actualizar mi estado"}
        </button>
        <span
          className={`text-sm text-emerald-600 transition-opacity duration-300 ${
            saved ? "opacity-100" : "opacity-0"
          }`}
        >
          Guardado
        </span>
      </div>
    </div>
  );
}
