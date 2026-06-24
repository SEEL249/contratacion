// Estado operativo de una entidad (tenant). Lógica pura (sin BD), reutilizable
// por el login (bloqueo), el panel de superadmin y el middleware.

export type EstadoTenant = "ACTIVA" | "SUSPENDIDA" | "EN_MORA";

export interface TenantEstadoInput {
  activo: boolean;
  fechaVencimiento: Date | null;
}

/** En mora = tiene fecha de vencimiento y ya pasó. */
export function tenantEnMora(t: TenantEstadoInput, ahora: Date = new Date()): boolean {
  return !!t.fechaVencimiento && t.fechaVencimiento.getTime() < ahora.getTime();
}

/** Bloqueado = suspendido manualmente (inactivo) o en mora. Sus usuarios no pueden entrar. */
export function tenantBloqueado(t: TenantEstadoInput, ahora: Date = new Date()): boolean {
  return !t.activo || tenantEnMora(t, ahora);
}

export function estadoTenant(t: TenantEstadoInput, ahora: Date = new Date()): EstadoTenant {
  if (!t.activo) return "SUSPENDIDA";
  if (tenantEnMora(t, ahora)) return "EN_MORA";
  return "ACTIVA";
}

export const ESTADO_LABEL: Record<EstadoTenant, string> = {
  ACTIVA: "Activa",
  SUSPENDIDA: "Suspendida",
  EN_MORA: "En mora",
};

export const ESTADO_PILL: Record<EstadoTenant, string> = {
  ACTIVA: "pill ok",
  SUSPENDIDA: "pill off",
  EN_MORA: "pill warn",
};
