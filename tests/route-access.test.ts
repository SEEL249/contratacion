import { describe, it, expect } from "vitest";
import { esPublica, rutaPermitida } from "@/lib/auth/route-access";

describe("Acceso a rutas por rol", () => {
  it("identifica rutas públicas", () => {
    expect(esPublica("/")).toBe(true);
    expect(esPublica("/login")).toBe(true);
    expect(esPublica("/dashboard")).toBe(false);
  });

  it("permite a contratación gestionar contratos y revisiones", () => {
    expect(rutaPermitida("/contratos", "PERSONA_CONTRATACION")).toBe(true);
    expect(rutaPermitida("/contratos/abc", "PERSONA_CONTRATACION")).toBe(true);
    expect(rutaPermitida("/revisiones", "PERSONA_CONTRATACION")).toBe(true);
  });

  it("bloquea al contratista de contratos y revisiones", () => {
    expect(rutaPermitida("/contratos", "CONTRATISTA")).toBe(false);
    expect(rutaPermitida("/revisiones", "CONTRATISTA")).toBe(false);
  });

  it("permite al contratista sus cuentas de cobro", () => {
    expect(rutaPermitida("/cuentas-cobro", "CONTRATISTA")).toBe(true);
    expect(rutaPermitida("/cuentas-cobro/abc", "CONTRATISTA")).toBe(true);
  });

  it("restringe la supervisión al supervisor", () => {
    expect(rutaPermitida("/supervision", "SUPERVISOR")).toBe(true);
    expect(rutaPermitida("/supervision", "PERSONA_CONTRATACION")).toBe(false);
  });

  it("restringe /superadmin al superadmin", () => {
    expect(rutaPermitida("/superadmin/tenants", "SUPERADMIN")).toBe(true);
    expect(rutaPermitida("/superadmin/tenants", "ADMIN_TENANT")).toBe(false);
  });

  it("rutas sin regla (p. ej. /dashboard) las pasa cualquier rol autenticado", () => {
    expect(rutaPermitida("/dashboard", "CONTRATISTA")).toBe(true);
    expect(rutaPermitida("/dashboard", "SUPERVISOR")).toBe(true);
  });
});
