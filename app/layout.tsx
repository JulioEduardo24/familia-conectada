import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Familia Conectada",
  description:
    "Tablero, mapa y chat para que tu familia se mantenga en contacto durante emergencias.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
