import { describe, it, expect } from "vitest";
import { aplicarScopeTenant, esModeloScoped } from "@/lib/db/tenant-scope-core";

const T = "tenant-123";

describe("Aislamiento multi-tenant (aplicarScopeTenant)", () => {
  it("identifica modelos scoped y no-scoped", () => {
    expect(esModeloScoped("CuentaCobro")).toBe(true);
    expect(esModeloScoped("Contrato")).toBe(true);
    // No llevan tenantId directo:
    expect(esModeloScoped("ContratoContratista")).toBe(false);
    expect(esModeloScoped("ObligacionEjecutada")).toBe(false);
    expect(esModeloScoped(undefined)).toBe(false);
  });

  it("inyecta tenantId en el where de las lecturas", () => {
    const r = aplicarScopeTenant("Contrato", "findMany", { where: { id: "x" } }, T);
    expect(r.where).toEqual({ id: "x", tenantId: T });
  });

  it("inyecta tenantId aunque no haya where", () => {
    const r = aplicarScopeTenant("CuentaCobro", "findFirst", {}, T);
    expect(r.where).toEqual({ tenantId: T });
  });

  it("inyecta tenantId en data al crear", () => {
    const r = aplicarScopeTenant("Contrato", "create", { data: { objeto: "x" } }, T);
    expect(r.data).toEqual({ objeto: "x", tenantId: T });
  });

  it("inyecta tenantId en cada fila de createMany", () => {
    const r = aplicarScopeTenant("Revision", "createMany", { data: [{ a: 1 }, { a: 2 }] }, T);
    expect(r.data).toEqual([
      { a: 1, tenantId: T },
      { a: 2, tenantId: T },
    ]);
  });

  it("restringe update/delete por tenant vía where", () => {
    expect(aplicarScopeTenant("Acta", "update", { where: { id: "1" } }, T).where).toEqual({
      id: "1",
      tenantId: T,
    });
    expect(aplicarScopeTenant("Acta", "delete", { where: { id: "1" } }, T).where).toEqual({
      id: "1",
      tenantId: T,
    });
  });

  it("en upsert inyecta tenantId en where y en create", () => {
    const r = aplicarScopeTenant("Plantilla", "upsert", { where: { id: "1" }, create: { n: 1 } }, T);
    expect(r.where).toEqual({ id: "1", tenantId: T });
    expect(r.create).toEqual({ n: 1, tenantId: T });
  });

  it("NO toca modelos no-scoped", () => {
    const r = aplicarScopeTenant("ContratoContratista", "findUnique", { where: { id: "1" } }, T);
    expect(r.where).toEqual({ id: "1" });
  });

  it("no muta el objeto args original", () => {
    const args = { where: { id: "x" } };
    aplicarScopeTenant("Contrato", "findMany", args, T);
    expect(args.where).toEqual({ id: "x" });
  });
});
