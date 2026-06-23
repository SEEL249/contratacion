import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password (scrypt)", () => {
  it("verifica la contraseña correcta", () => {
    const h = hashPassword("Demo1234*");
    expect(verifyPassword("Demo1234*", h)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", () => {
    const h = hashPassword("Demo1234*");
    expect(verifyPassword("otra", h)).toBe(false);
  });

  it("usa salt distinto en cada hash", () => {
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
  });

  it("rechaza un hash con formato inválido", () => {
    expect(verifyPassword("x", "formato-malo")).toBe(false);
  });
});
