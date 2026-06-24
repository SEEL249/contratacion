import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import type { Role } from "@prisma/client";

// Panel inicial. Muestra accesos según el rol del usuario autenticado.

type Acceso = { href: string; label: string; desc: string; icon: React.ReactNode };

const I = {
  building: <path d="M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-4h6v4 M9 9h.01 M15 9h.01 M9 13h.01 M15 13h.01" />,
  doc: <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z M14 2v6h6 M8 13h8 M8 17h5" />,
  check: <path d="M9 12l2 2 4-4 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  users: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />,
  layers: <path d="M12 2 2 7l10 5 10-5-10-5Z M2 17l10 5 10-5 M2 12l10 5 10-5" />,
  receipt: <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z M8 7h8 M8 11h8 M8 15h5" />,
  eye: <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  plus: <path d="M12 5v14 M5 12h14" />,
};

const ACCESOS: Record<Role, Acceso[]> = {
  SUPERADMIN: [
    {
      href: "/superadmin/tenants",
      label: "Gestionar entidades",
      desc: "Crear y administrar las entidades (tenants) de la plataforma y sus administradores.",
      icon: I.building,
    },
  ],
  ADMIN_TENANT: [
    { href: "/usuarios", label: "Usuarios", desc: "Gestiona los usuarios de tu entidad y sus roles.", icon: I.users },
    { href: "/plantillas", label: "Plantillas", desc: "Plantillas de contratos, actas y cuentas de cobro.", icon: I.layers },
    { href: "/contratos", label: "Contratos", desc: "Consulta y administra los contratos de la entidad.", icon: I.doc },
  ],
  PERSONA_CONTRATACION: [
    { href: "/contratos", label: "Contratos", desc: "Crea contratos, define obligaciones y asigna contratistas.", icon: I.doc },
    { href: "/revisiones", label: "Revisiones pendientes", desc: "Aprueba o rechaza cuentas de cobro enviadas a revisión.", icon: I.check },
  ],
  SUPERVISOR: [
    { href: "/supervision", label: "Informe de supervisión", desc: "Informes de supervisión del mes actual.", icon: I.eye },
  ],
  CONTRATISTA: [
    { href: "/cuentas-cobro/nueva", label: "Crear cuenta de cobro", desc: "Genera una nueva cuenta de cobro con tus informes.", icon: I.plus },
    { href: "/cuentas-cobro", label: "Mis cuentas de cobro", desc: "Consulta el estado de tus cuentas de cobro.", icon: I.receipt },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  SUPERADMIN: "Superadministrador",
  ADMIN_TENANT: "Administrador de entidad",
  PERSONA_CONTRATACION: "Persona de contratación",
  SUPERVISOR: "Supervisor",
  CONTRATISTA: "Contratista",
};

export default async function DashboardPage() {
  let ctx;
  try {
    ctx = await requireSession();
  } catch {
    redirect("/login");
  }

  const accesos = ACCESOS[ctx.role] ?? [];

  return (
    <main>
      <div className="page-head">
        <h1>Panel</h1>
        <p>
          Bienvenido. Tu rol es <b>{ROLE_LABEL[ctx.role]}</b>. Estos son tus accesos disponibles.
        </p>
      </div>

      {accesos.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No tienes accesos asignados.</p>
      ) : (
        <div className="tiles">
          {accesos.map((a) => (
            <Link key={a.href} href={a.href} className="tile">
              <span className="ic" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {a.icon}
                </svg>
              </span>
              <h3>{a.label}</h3>
              <p>{a.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
