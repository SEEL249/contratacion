import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { diasParaVencer } from "@/lib/tenants/plan";
import { SiteHeader } from "./_components/site-header";
import { AvisoVencimiento } from "./_components/aviso-vencimiento";

export const metadata: Metadata = {
  title: "Gestión de Contratistas — Sector Público",
  description: "Plataforma multi-tenant de gestión de contratos del sector público",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user ? { name: session.user.name, role: session.user.role } : null;

  // Aviso de vencimiento (≤10 días) para usuarios de una entidad.
  let avisoDias: number | null = null;
  let avisoFecha: string | null = null;
  if (session?.user?.tenantId) {
    const t = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { fechaVencimiento: true },
    });
    const d = diasParaVencer(t?.fechaVencimiento ?? null);
    if (d !== null && d > 0 && d <= 10) {
      avisoDias = d;
      avisoFecha = t!.fechaVencimiento
        ? new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(t!.fechaVencimiento)
        : null;
    }
  }

  return (
    <html lang="es">
      <body>
        <SiteHeader user={user} />
        <AvisoVencimiento dias={avisoDias} fecha={avisoFecha} />
        {children}
      </body>
    </html>
  );
}
