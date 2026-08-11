export type StatusValue = "bien" | "ayuda" | "sin_noticias";

export interface FamilyMember {
  id: string;
  full_name: string;
  status: StatusValue;
  message: string | null;
  location_text: string | null;
  lat: number | null;
  lng: number | null;
  updated_at: string | null;
}

export const STATUS_LABEL: Record<StatusValue, string> = {
  bien: "Estoy bien",
  ayuda: "Necesito ayuda",
  sin_noticias: "Sin noticias",
};

export const STATUS_COLOR: Record<StatusValue, string> = {
  bien: "#16a34a", // verde
  ayuda: "#dc2626", // rojo
  sin_noticias: "#a1a1aa", // gris
};

export const STATUS_ICON: Record<StatusValue, string> = {
  bien: "",
  ayuda: "",
  sin_noticias: "",
};
