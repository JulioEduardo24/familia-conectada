"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(`No se pudo iniciar sesión: ${error.message}`);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-8 sm:py-12 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Familia Conectada
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ingresa a tu cuenta familiar
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Correo
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base outline-none transition-colors focus:border-zinc-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base outline-none transition-colors focus:border-zinc-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 min-h-[46px] w-full touch-manipulation rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿Primera vez?{" "}
          <Link href="/signup" className="font-medium text-zinc-900 underline dark:text-zinc-50">
            Crear cuenta familiar
          </Link>
        </p>
      </div>
    </div>
  );
}
