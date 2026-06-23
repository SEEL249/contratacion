import { describe, it, expect } from "vitest";
import { crearCuentaCobroInput } from "@/modules/cuentas-cobro/schema";

const base = {
  asignacionId: "a1",
  plataformaSeguridadSocial: "SOI",
  numeroPlanilla: "PL-001",
  tipoPlanilla: "I" as const,
  tipoVinculacion: "PROFESIONAL" as const,
};

describe("crearCuentaCobroInput", () => {
  it("acepta datos completos de seguridad social", () => {
    expect(crearCuentaCobroInput.safeParse(base).success).toBe(true);
  });

  it("exige número de planilla", () => {
    const r = crearCuentaCobroInput.safeParse({ ...base, numeroPlanilla: "" });
    expect(r.success).toBe(false);
  });

  it("exige plataforma de pago", () => {
    const r = crearCuentaCobroInput.safeParse({ ...base, plataformaSeguridadSocial: "" });
    expect(r.success).toBe(false);
  });

  it("tipoPlanilla es opcional", () => {
    const { tipoPlanilla, ...sinTipo } = base;
    expect(crearCuentaCobroInput.safeParse(sinTipo).success).toBe(true);
  });
});
