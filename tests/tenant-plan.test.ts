import { describe, it, expect } from "vitest";
import { addMeses, calcularVencimiento, diasParaVencer, PLAN_MESES } from "../src/lib/tenants/plan";

describe("planes y vencimiento", () => {
  it("periodos de cada plan", () => {
    expect(PLAN_MESES).toEqual({ MENSUAL: 1, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12 });
  });

  it("calcula vencimiento desde la base según el plan", () => {
    const base = new Date("2026-01-15T00:00:00");
    expect(calcularVencimiento(base, "MENSUAL").toISOString().slice(0, 10)).toBe("2026-02-15");
    expect(calcularVencimiento(base, "TRIMESTRAL").toISOString().slice(0, 10)).toBe("2026-04-15");
    expect(calcularVencimiento(base, "SEMESTRAL").toISOString().slice(0, 10)).toBe("2026-07-15");
    expect(calcularVencimiento(base, "ANUAL").toISOString().slice(0, 10)).toBe("2027-01-15");
  });

  it("clamp a fin de mes (31 ene + 1 mes = 28/29 feb)", () => {
    const base = new Date("2026-01-31T00:00:00");
    expect(addMeses(base, 1).toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("días para vencer: futuro positivo, pasado negativo, null sin fecha", () => {
    const ahora = new Date("2026-06-24T12:00:00Z");
    expect(diasParaVencer(new Date("2026-07-04T12:00:00Z"), ahora)).toBe(10);
    expect(diasParaVencer(new Date("2026-06-20T12:00:00Z"), ahora)).toBe(-4);
    expect(diasParaVencer(null, ahora)).toBeNull();
  });
});
