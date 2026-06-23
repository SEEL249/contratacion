import type { Role } from "@prisma/client";

// Reglas de acceso a rutas por rol (lógica pura, edge-safe y testeable).
// La usa el middleware. Ver docs/03-rfc-arquitectura.md §3.

// Prefijo de ruta → roles autorizados. Alineado con el panel (dashboard).
export const RUTAS_POR_ROL: { prefix: string; roles: Role[] }[] = [
  { prefix: "/superadmin", roles: ["SUPERADMIN"] },
  { prefix: "/contratos", roles: ["PERSONA_CONTRATACION", "ADMIN_TENANT"] },
  { prefix: "/revisiones", roles: ["PERSONA_CONTRATACION"] },
  { prefix: "/cuentas-cobro", roles: ["CONTRATISTA"] },
  { prefix: "/supervision", roles: ["SUPERVISOR"] },
  { prefix: "/plantillas", roles: ["ADMIN_TENANT"] },
  { prefix: "/usuarios", roles: ["ADMIN_TENANT"] },
];

// Rutas públicas (no requieren sesión).
export const PUBLICAS = ["/", "/login"];

export function esPublica(pathname: string): boolean {
  return PUBLICAS.includes(pathname);
}

/**
 * ¿El rol puede acceder a la ruta? Si ningún prefijo coincide, la ruta solo
 * exige sesión (cualquier rol autenticado pasa, p. ej. /dashboard).
 */
export function rutaPermitida(pathname: string, role: Role): boolean {
  const regla = RUTAS_POR_ROL.find((r) => pathname.startsWith(r.prefix));
  return !regla || regla.roles.includes(role);
}
