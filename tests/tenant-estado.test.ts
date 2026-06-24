import { describe, it, expect } from "vitest";
import {
  estadoTenant,
  tenantEnMora,
  tenantBloqueado,
} from "../src/lib/tenants/estado";

const ahora = new Date("2026-06-24T12:00:00Z");
const ayer = new Date("2026-06-23T00:00:00Z");
const manana = new Date("2026-06-25T00:00:00Z");

describe("estado del tenant (mora / suspensión)", () => {
  it("activa sin vencimiento", () => {
    const t = { activo: true, fechaVencimiento: null };
    expect(estadoTenant(t, ahora)).toBe("ACTIVA");
    expect(tenantBloqueado(t, ahora)).toBe(false);
  });

  it("activa con vencimiento futuro", () => {
    const t = { activo: true, fechaVencimiento: manana };
    expect(estadoTenant(t, ahora)).toBe("ACTIVA");
    expect(tenantEnMora(t, ahora)).toBe(false);
    expect(tenantBloqueado(t, ahora)).toBe(false);
  });

  it("en mora cuando el vencimiento ya pasó → bloqueado", () => {
    const t = { activo: true, fechaVencimiento: ayer };
    expect(tenantEnMora(t, ahora)).toBe(true);
    expect(estadoTenant(t, ahora)).toBe("EN_MORA");
    expect(tenantBloqueado(t, ahora)).toBe(true);
  });

  it("suspendida manualmente (inactivo) → bloqueado, prioritario sobre mora", () => {
    const t = { activo: false, fechaVencimiento: manana };
    expect(estadoTenant(t, ahora)).toBe("SUSPENDIDA");
    expect(tenantBloqueado(t, ahora)).toBe(true);
  });

  it("inactivo y en mora → SUSPENDIDA (prioridad) pero bloqueado igual", () => {
    const t = { activo: false, fechaVencimiento: ayer };
    expect(estadoTenant(t, ahora)).toBe("SUSPENDIDA");
    expect(tenantBloqueado(t, ahora)).toBe(true);
  });
});
