import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión de Contratistas — OSS",
  description: "Plataforma multi-tenant de gestión de contratos del sector público",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
