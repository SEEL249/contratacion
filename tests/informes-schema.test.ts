import { describe, it, expect } from "vitest";
import { registrarObligacionInput } from "@/modules/informes/schema";

const evidencia = {
  tipo: "PDF" as const,
  blobUrl: "https://blob.example.co/e1.pdf",
  nombre: "evidencia.pdf",
  mimeType: "application/pdf",
  tamanoBytes: 1024,
};

const base = {
  cuentaCobroId: "c1",
  obligacionContratoId: "o1",
  descripcionContratista: "Realicé el apoyo a la gestión del área.",
  evidencias: [evidencia],
  ampliarConIa: true,
};

describe("registrarObligacionInput", () => {
  it("acepta una obligación con evidencia", () => {
    expect(registrarObligacionInput.safeParse(base).success).toBe(true);
  });

  it("RECHAZA si no hay evidencia (regla: evidencia obligatoria)", () => {
    const r = registrarObligacionInput.safeParse({ ...base, evidencias: [] });
    expect(r.success).toBe(false);
  });

  it("rechaza descripción demasiado corta", () => {
    const r = registrarObligacionInput.safeParse({ ...base, descripcionContratista: "ok" });
    expect(r.success).toBe(false);
  });

  it("rechaza una evidencia con URL inválida", () => {
    const r = registrarObligacionInput.safeParse({
      ...base,
      evidencias: [{ ...evidencia, blobUrl: "no-es-url" }],
    });
    expect(r.success).toBe(false);
  });

  it("ampliarConIa por defecto es true", () => {
    const { ampliarConIa, ...sinFlag } = base;
    const r = registrarObligacionInput.parse(sinFlag);
    expect(r.ampliarConIa).toBe(true);
  });
});
