import { describe, it, expect } from "vitest";
import { can, assertCan } from "@/lib/auth/permissions";

describe("RBAC (can / assertCan)", () => {
  it("la persona de contratación puede crear y revisar contratos", () => {
    expect(can("PERSONA_CONTRATACION", "contrato:create")).toBe(true);
    expect(can("PERSONA_CONTRATACION", "revision:approve")).toBe(true);
    expect(can("PERSONA_CONTRATACION", "revision:reject")).toBe(true);
  });

  it("el contratista puede crear cuentas e informes, pero no aprobar", () => {
    expect(can("CONTRATISTA", "cuentaCobro:create")).toBe(true);
    expect(can("CONTRATISTA", "informe:create")).toBe(true);
    expect(can("CONTRATISTA", "revision:approve")).toBe(false);
    expect(can("CONTRATISTA", "contrato:create")).toBe(false);
  });

  it("el supervisor solo puede leer la supervisión", () => {
    expect(can("SUPERVISOR", "supervision:read")).toBe(true);
    expect(can("SUPERVISOR", "cuentaCobro:create")).toBe(false);
    expect(can("SUPERVISOR", "contrato:read")).toBe(false);
  });

  it("el superadmin gestiona tenants pero no es del dominio del tenant", () => {
    expect(can("SUPERADMIN", "tenant:manage")).toBe(true);
    expect(can("SUPERADMIN", "contrato:create")).toBe(false);
  });

  it("assertCan lanza cuando no hay permiso", () => {
    expect(() => assertCan("CONTRATISTA", "revision:approve")).toThrow();
    expect(() => assertCan("PERSONA_CONTRATACION", "contrato:create")).not.toThrow();
  });
});
