"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  full_name: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Chat({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, user_id, content, created_at")
        .order("created_at", { ascending: true })
        .limit(200);

      const { data: profiles } = await supabase.from("profiles").select("id, full_name");
      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

      if (!cancelled) {
        setMessages(
          (msgs ?? []).map((m) => ({
            ...m,
            full_name: nameById.get(m.user_id) ?? "Familiar",
          }))
        );
        setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => load()
      )
      .subscribe();

    // Respaldo por si el realtime no llega (redes de emergencia poco
    // confiables): revisa por mensajes nuevos cada pocos segundos.
    const interval = setInterval(load, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    setSending(true);
    setError(null);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({ user_id: userId, content })
      .select("id, user_id, content, created_at")
      .single();

    if (insertError || !data) {
      setError(
        insertError?.message ??
          "No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo."
      );
      setSending(false);
      return;
    }

    // Mostramos el mensaje de inmediato en vez de esperar a Realtime.
    setMessages((prev) => [...prev, { ...data, full_name: "" }]);
    setText("");
    setSending(false);
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-zinc-200 sm:h-[65vh] dark:border-zinc-800">
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {loading ? (
          <p className="text-sm text-zinc-500">Cargando mensajes...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no hay mensajes. Escribe el primero.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              const mine = m.user_id === userId;
              return (
                <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    }`}
                  >
                    {!mine && <p className="mb-0.5 text-xs font-semibold opacity-70">{m.full_name}</p>}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                  <span className="mt-1 text-[11px] text-zinc-400">{formatTime(m.created_at)}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && (
        <p className="border-t border-zinc-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-zinc-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t border-zinc-200 p-2.5 sm:p-3 dark:border-zinc-800"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="min-h-[44px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none transition-colors focus:border-zinc-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="min-h-[44px] touch-manipulation rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
