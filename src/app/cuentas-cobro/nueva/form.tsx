"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearCuentaCobro } from "@/modules/cuentas-cobro/actions";

interface Asignacion {
  id: string;
  numeroContrato: string;
  objeto: string;
  numeroCuotas: number;
  cuotasUsadas: number;
  tipoVinculacion: "PROFESIONAL" | "APOYO_GESTION";
}

// Plataformas PILA (deberían venir de la config del tenant). Ver reglas §3.2.
const PLATAFORMAS = ["SOI", "APORTES_EN_LINEA", "MI_PLANILLA", "COMPENSAR", "ASOPAGOS", "OTRO"];

export default function NuevaCuentaForm({ asignaciones }: { asignaciones: Asignacion[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<string>(asignaciones[0]?.id ?? "");

  const actual = asignaciones.find((a) => a.id === sel);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const c = await crearCuentaCobro({
          asignacionId: sel,
          plataformaSeguridadSocial: String(fd.get("plataforma")),
          numeroPlanilla: String(fd.get("numeroPlanilla")),
          tipoPlanilla: (fd.get("tipoPlanilla") as "I" | "Y") || undefined,
          tipoVinculacion: fd.get("tipoVinculacion") as "PROFESIONAL" | "APOYO_GESTION",
        });
        router.push(`/cuentas-cobro/${c.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear la cuenta");
      }
    });
  }

  if (asignaciones.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No tiene contratos asignados.</p>;
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 480 }}>
      <label>
        Contrato
        <select value={sel} onChange={(e) => setSel(e.target.value)}>
          {asignaciones.map((a) => (
            <option key={a.id} value={a.id}>
              {a.numeroContrato} — {a.objeto.slice(0, 40)} ({a.cuotasUsadas}/{a.numeroCuotas} cuotas)
            </option>
          ))}
        </select>
      </label>

      {actual && (
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Se creará la cuenta de la cuota {actual.cuotasUsadas + 1} de {actual.numeroCuotas}.
        </p>
      )}

      <label>
        Plataforma de seguridad social
        <select name="plataforma" required>
          {PLATAFORMAS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <label>
        N.º de planilla
        <input name="numeroPlanilla" required />
      </label>
      <label>
        Tipo de planilla PILA
        <select name="tipoPlanilla">
          <option value="I">I — Independientes</option>
          <option value="Y">Y — Independientes con novedad</option>
        </select>
      </label>
      <label>
        Tipo de vinculación
        <select name="tipoVinculacion" defaultValue={actual?.tipoVinculacion} required>
          <option value="PROFESIONAL">Profesional</option>
          <option value="APOYO_GESTION">Apoyo a la gestión</option>
        </select>
      </label>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear cuenta de cobro"}
      </button>
    </form>
  );
}
