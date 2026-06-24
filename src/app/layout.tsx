import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth/auth";
import { SiteHeader } from "./_components/site-header";

export const metadata: Metadata = {
  title: "Gestión de Contratistas — Sector Público",
  description: "Plataforma multi-tenant de gestión de contratos del sector público",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user ? { name: session.user.name, role: session.user.role } : null;

  return (
    <html lang="es">
      <body>
        <SiteHeader user={user} />
        {children}
      </body>
    </html>
  );
}
