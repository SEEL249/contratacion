// Estado operativo de una entidad (tenant) según la vigencia de su CONTRATO con
// la plataforma. Lógica pura (sin BD). La usa el login (bloqueo), el panel de
// superadmin y el layout (avisos).

export type EstadoTenant = "ACTIVA" | "SUSPENDIDA" | "FINALIZADA";

export interface TenantEstadoInput {
  activo: boolean;
  fechaFinContrato: Date | null;
}

/** El contrato ya terminó (fecha de fin en el pasado). */
export function contratoFinalizado(t: TenantEstadoInput, ahora: Date = new Date()): boolean {
  return !!t.fechaFinContrato && t.fechaFinContrato.getTime() < ahora.getTime();
}

/** Bloqueada = suspendida manualmente (inactiva) o con contrato finalizado. */
export function tenantBloqueado(t: TenantEstadoInput, ahora: Date = new Date()): boolean {
  return !t.activo || contratoFinalizado(t, ahora);
}

export function estadoTenant(t: TenantEstadoInput, ahora: Date = new Date()): EstadoTenant {
  if (!t.activo) return "SUSPENDIDA";
  if (contratoFinalizado(t, ahora)) return "FINALIZADA";
  return "ACTIVA";
}

export const ESTADO_LABEL: Record<EstadoTenant, string> = {
  ACTIVA: "Activa",
  SUSPENDIDA: "Suspendida",
  FINALIZADA: "Contrato finalizado",
};

export const ESTADO_PILL: Record<EstadoTenant, string> = {
  ACTIVA: "pill ok",
  SUSPENDIDA: "pill off",
  FINALIZADA: "pill warn",
};

/** Días restantes hasta el fin del contrato (negativo si ya terminó). */
export function diasParaFin(fechaFinContrato: Date | null, ahora: Date = new Date()): number | null {
  if (!fechaFinContrato) return null;
  return Math.ceil((fechaFinContrato.getTime() - ahora.getTime()) / 86_400_000);
}

/** Umbral de aviso de finalización (días de antelación). */
export const DIAS_AVISO_FIN_CONTRATO = 90;
