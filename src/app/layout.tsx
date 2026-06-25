import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { diasParaFin, DIAS_AVISO_FIN_CONTRATO } from "@/lib/tenants/estado";
import { SiteHeader } from "./_components/site-header";
import { AvisoVencimiento, type AvisoItem } from "./_components/aviso-vencimiento";

export const metadata: Metadata = {
  title: "Gestión de Contratistas — Sector Público",
  description: "Plataforma multi-tenant de gestión de contratos del sector público",
};

const fmt = (d: Date) => new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(d);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user ? { name: session.user.name, role: session.user.role } : null;

  // Aviso de finalización de contrato (≤90 días).
  let modo: "tenant" | "superadmin" = "tenant";
  let avisos: AvisoItem[] = [];

  if (session?.user?.role === "SUPERADMIN") {
    modo = "superadmin";
    const hasta = new Date();
    hasta.setDate(hasta.getDate() + DIAS_AVISO_FIN_CONTRATO);
    const tenants = await prisma.tenant.findMany({
      where: { activo: true, fechaFinContrato: { gte: new Date(), lte: hasta } },
      select: { nombre: true, fechaFinContrato: true },
      orderBy: { fechaFinContrato: "asc" },
    });
    avisos = tenants
      .map((t) => ({ nombre: t.nombre, dias: diasParaFin(t.fechaFinContrato) ?? 0, fecha: fmt(t.fechaFinContrato!) }))
      .filter((a) => a.dias > 0);
  } else if (session?.user?.tenantId) {
    const t = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { nombre: true, fechaFinContrato: true },
    });
    const dias = diasParaFin(t?.fechaFinContrato ?? null);
    if (t?.fechaFinContrato && dias !== null && dias > 0 && dias <= DIAS_AVISO_FIN_CONTRATO) {
      avisos = [{ nombre: t.nombre, dias, fecha: fmt(t.fechaFinContrato) }];
    }
  }

  return (
    <html lang="es">
      <body>
        <SiteHeader user={user} />
        <AvisoVencimiento modo={modo} avisos={avisos} />
        {children}
      </body>
    </html>
  );
}
