"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/_actions/auth";

// Encabezado institucional compartido. Se renderiza en todas las páginas internas
// (no en la landing ni en el login). Recibe el usuario desde el layout (servidor).

const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: "Superadministrador",
  ADMIN_TENANT: "Administrador de entidad",
  PERSONA_CONTRATACION: "Persona de contratación",
  SUPERVISOR: "Supervisor",
  CONTRATISTA: "Contratista",
};

export function SiteHeader({
  user,
}: {
  user: { name?: string | null; role?: string | null } | null;
}) {
  const pathname = usePathname();

  // Oculto en páginas públicas (tienen su propio encabezado / layout).
  if (!user) return null;
  if (pathname === "/" || pathname.startsWith("/login")) return null;

  return (
    <header className="site-header">
      <div className="accent" />
      <div className="bar">
        <Link href="/dashboard" className="brand">
          <span className="logo" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z" />
            </svg>
          </span>
          <span>
            Contratación <small>· Sector Público</small>
          </span>
        </Link>
        <div className="who">
          {user.role && <span className="role">{ROLE_LABEL[user.role] ?? user.role}</span>}
          <form action={logoutAction}>
            <button type="submit" className="logout">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
