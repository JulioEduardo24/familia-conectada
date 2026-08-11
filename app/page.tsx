import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Auto-reparación: si por algún motivo el perfil no se creó al registrarse
  // (por ejemplo, la confirmación de correo estaba activada en ese momento),
  // lo creamos aquí para que la cuenta quede utilizable.
  if (!profile) {
    const fallbackName =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "Familiar";

    const { data: createdProfile } = await supabase
      .from("profiles")
      .insert({ id: user.id, full_name: fallbackName })
      .select("full_name")
      .single();

    await supabase
      .from("statuses")
      .upsert({ user_id: user.id, status: "sin_noticias" }, { onConflict: "user_id" });

    profile = createdProfile ?? { full_name: fallbackName };
  }

  return (
    <Dashboard userId={user.id} fullName={profile?.full_name ?? "Familiar"} />
  );
}
