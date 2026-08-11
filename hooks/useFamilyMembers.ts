"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMember, StatusValue } from "@/lib/types";

async function fetchMembers(): Promise<FamilyMember[]> {
  const supabase = createClient();

  const [{ data: profiles }, { data: statuses }] = await Promise.all([
    supabase.from("profiles").select("id, full_name"),
    supabase.from("statuses").select("*"),
  ]);

  const statusByUser = new Map((statuses ?? []).map((s) => [s.user_id, s]));

  const merged: FamilyMember[] = (profiles ?? []).map((p) => {
    const s = statusByUser.get(p.id);
    return {
      id: p.id,
      full_name: p.full_name,
      status: (s?.status as StatusValue) ?? "sin_noticias",
      message: s?.message ?? null,
      location_text: s?.location_text ?? null,
      lat: s?.lat ?? null,
      lng: s?.lng ?? null,
      updated_at: s?.updated_at ?? null,
    };
  });

  merged.sort((a, b) => a.full_name.localeCompare(b.full_name));
  return merged;
}

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    fetchMembers().then((merged) => {
      if (mountedRef.current) {
        setMembers(merged);
        setLoading(false);
      }
    });

    const supabase = createClient();
    const refetch = () => {
      fetchMembers().then((merged) => {
        if (mountedRef.current) setMembers(merged);
      });
    };

    const channel = supabase
      .channel("family-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "statuses" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refetch)
      .subscribe();

    // Respaldo por si el realtime no llega (redes de emergencia poco
    // confiables): refresca solo igualmente cada pocos segundos.
    const interval = setInterval(refetch, 6000);

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [reloadTick]);

  return {
    members,
    loading,
    refresh: () => setReloadTick((t) => t + 1),
  };
}
