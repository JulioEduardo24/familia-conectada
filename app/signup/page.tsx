"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const verifyRes = await fetch("/api/verify-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.ok) {
        setError(verifyData.error ?? "Código de invitación incorrecto.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (signUpError) {
        setError(
          signUpError.message.includes("already registered")
            ? "Ese correo ya tiene una cuenta. Intenta iniciar sesión."
            : "No se pudo crear la cuenta. Intenta de nuevo."
        );
        setLoading(false);
        return;
      }

      // Solo podemos crear el perfil aquí si ya quedamos autenticados
      // (sesión activa). Si el proyecto de Supabase pide confirmar el
      // correo, no hay sesión todavía y el perfil se crea solo la primera
      // vez que la persona entra a la app ya confirmada.
      if (data.user && data.session) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: fullName.trim(),
        });

        if (profileError) {
          setError(
            "La cuenta se creó pero no se pudo configurar el perfil (" +
              profileError.message +
              "). Avisa a quien administra la plataforma."
          );
          setLoading(false);
          return;
        }

        await supabase.from("statuses").insert({
          user_id: data.user.id,
          status: "sin_noticias",
        });
      }

      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setInfo(
          "Cuenta creada. Revisa tu correo para confirmar la cuenta antes de ingresar."
        );
        setLoading(false);
      }
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-8 sm:py-12 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Crear cuenta familiar
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Necesitas el código de invitación de tu familia
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nombre
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base outline-none transition-colors focus:border-zinc-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Ej. María Calla"
            />
          </div>

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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base outline-none transition-colors focus:border-zinc-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Código de invitación familiar
            </label>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base outline-none transition-colors focus:border-zinc-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Pídeselo a quien creó la plataforma"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 min-h-[46px] w-full touch-manipulation rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-50">
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
