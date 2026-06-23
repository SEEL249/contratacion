import { describe, it, expect } from "vitest";
import { crearContratoInput } from "@/modules/contratos/schema";

const base = {
  objeto: "Prestación de servicios profesionales de apoyo.",
  vigenciaInicio: "2026-07-01",
  vigenciaFin: "2026-12-31",
  valorTotal: 30000000,
  valorCuota: 5000000,
  numeroCuotas: 6,
  tipoVinculacion: "PROFESIONAL" as const,
  obligaciones: [{ texto: "Apoyar la gestión administrativa.", orden: 1 }],
};

describe("crearContratoInput", () => {
  it("acepta un contrato coherente", () => {
    expect(crearContratoInput.safeParse(base).success).toBe(true);
  });

  it("rechaza si valorCuota × numeroCuotas ≠ valorTotal", () => {
    const r = crearContratoInput.safeParse({ ...base, valorCuota: 4000000 });
    expect(r.success).toBe(false);
  });

  it("rechaza si la vigencia final no es posterior a la inicial", () => {
    const r = crearContratoInput.safeParse({
      ...base,
      vigenciaInicio: "2026-12-31",
      vigenciaFin: "2026-07-01",
    });
    expect(r.success).toBe(false);
  });

  it("exige al menos una obligación", () => {
    const r = crearContratoInput.safeParse({ ...base, obligaciones: [] });
    expect(r.success).toBe(false);
  });

  it("rechaza tipo de vinculación inválido", () => {
    const r = crearContratoInput.safeParse({ ...base, tipoVinculacion: "OTRO" });
    expect(r.success).toBe(false);
  });
});
