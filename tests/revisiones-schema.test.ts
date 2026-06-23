import { describe, it, expect } from "vitest";
import { revisarInput } from "@/modules/revisiones/schema";

describe("revisarInput", () => {
  it("aprueba sin observaciones", () => {
    const r = revisarInput.safeParse({ cuentaCobroId: "c1", accion: "APROBAR" });
    expect(r.success).toBe(true);
  });

  it("RECHAZA sin observaciones falla (regla: observaciones obligatorias)", () => {
    const r = revisarInput.safeParse({ cuentaCobroId: "c1", accion: "RECHAZAR" });
    expect(r.success).toBe(false);
  });

  it("rechaza con observaciones demasiado cortas falla", () => {
    const r = revisarInput.safeParse({ cuentaCobroId: "c1", accion: "RECHAZAR", observaciones: "no" });
    expect(r.success).toBe(false);
  });

  it("rechaza con observaciones válidas pasa", () => {
    const r = revisarInput.safeParse({
      cuentaCobroId: "c1",
      accion: "RECHAZAR",
      observaciones: "Corrija la redacción de la obligación 2 y adjunte el soporte.",
    });
    expect(r.success).toBe(true);
  });
});
