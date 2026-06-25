import { describe, it, expect } from "vitest";
import {
  estadoTenant,
  contratoFinalizado,
  tenantBloqueado,
  diasParaFin,
} from "../src/lib/tenants/estado";

const ahora = new Date("2026-06-24T12:00:00Z");
const ayer = new Date("2026-06-23T00:00:00Z");
const manana = new Date("2026-06-25T00:00:00Z");

describe("estado del tenant según vigencia del contrato", () => {
  it("activa sin fecha de fin (contrato indefinido)", () => {
    const t = { activo: true, fechaFinContrato: null };
    expect(estadoTenant(t, ahora)).toBe("ACTIVA");
    expect(tenantBloqueado(t, ahora)).toBe(false);
  });

  it("activa con contrato vigente (fin futuro)", () => {
    const t = { activo: true, fechaFinContrato: manana };
    expect(estadoTenant(t, ahora)).toBe("ACTIVA");
    expect(contratoFinalizado(t, ahora)).toBe(false);
    expect(tenantBloqueado(t, ahora)).toBe(false);
  });

  it("contrato finalizado (fin en el pasado) → bloqueada", () => {
    const t = { activo: true, fechaFinContrato: ayer };
    expect(contratoFinalizado(t, ahora)).toBe(true);
    expect(estadoTenant(t, ahora)).toBe("FINALIZADA");
    expect(tenantBloqueado(t, ahora)).toBe(true);
  });

  it("deshabilitada manualmente → SUSPENDIDA (prioritario) y bloqueada", () => {
    const t = { activo: false, fechaFinContrato: manana };
    expect(estadoTenant(t, ahora)).toBe("SUSPENDIDA");
    expect(tenantBloqueado(t, ahora)).toBe(true);
  });

  it("diasParaFin: positivo a futuro, negativo si terminó, null sin fecha", () => {
    expect(diasParaFin(new Date("2026-09-22T12:00:00Z"), ahora)).toBe(90);
    expect(diasParaFin(ayer, ahora)).toBe(-1);
    expect(diasParaFin(null, ahora)).toBeNull();
  });
});
