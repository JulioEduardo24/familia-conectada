"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StatusBoard from "@/components/StatusBoard";
import Chat from "@/components/Chat";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center text-sm text-zinc-500">
      Cargando mapa...
    </div>
  ),
});

type Tab = "tablero" | "mapa" | "chat";

const TABS: { id: Tab; label: string }[] = [
  { id: "tablero", label: "Tablero" },
  { id: "mapa", label: "Mapa" },
  { id: "chat", label: "Chat" },
];

export default function Dashboard({
  userId,
  fullName,
}: {
  userId: string;
  fullName: string;
}) {
  const [tab, setTab] = useState<Tab>("tablero");
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 py-4 sm:px-4 sm:py-6">
      <header className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
            Familia Conectada
          </h1>
          <p className="truncate text-sm text-zinc-500">Hola, {fullName}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="min-h-[40px] shrink-0 touch-manipulation rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          Salir
        </button>
      </header>

      <nav className="mb-4 flex gap-1 rounded-xl bg-zinc-100 p-1 sm:mb-5 dark:bg-zinc-900">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-[44px] flex-1 touch-manipulation rounded-lg px-2 py-2 text-sm font-medium transition-all duration-150 active:scale-95 sm:px-3 ${
              tab === t.id
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1">
        {tab === "tablero" && <StatusBoard userId={userId} />}
        {tab === "mapa" && <LiveMap />}
        {tab === "chat" && <Chat userId={userId} />}
      </div>
    </div>
  );
}
