// Planes de suscripción y cálculo de vencimiento. Lógica pura (sin BD).

export type Plan = "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

export const PLANES: Plan[] = ["MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"];

export const PLAN_MESES: Record<Plan, number> = {
  MENSUAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

export const PLAN_LABEL: Record<Plan, string> = {
  MENSUAL: "Mensual",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

/** Suma meses preservando el día (clamp a fin de mes cuando aplica). */
export function addMeses(base: Date, meses: number): Date {
  const d = new Date(base);
  const dia = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + meses);
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dia, ultimoDia));
  return d;
}

/** Vencimiento = base + periodo del plan. */
export function calcularVencimiento(base: Date, plan: Plan): Date {
  return addMeses(base, PLAN_MESES[plan]);
}

/** Días restantes hasta el vencimiento (negativo si ya venció). */
export function diasParaVencer(fechaVencimiento: Date | null, ahora: Date = new Date()): number | null {
  if (!fechaVencimiento) return null;
  const ms = fechaVencimiento.getTime() - ahora.getTime();
  return Math.ceil(ms / 86_400_000);
}
