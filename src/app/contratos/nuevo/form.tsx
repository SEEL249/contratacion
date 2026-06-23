"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearContrato } from "@/modules/contratos/actions";

// Formulario de creación de contrato. Las obligaciones se ingresan una por línea.
export default function NuevoContratoForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const obligaciones = String(fd.get("obligaciones") ?? "")
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((texto, i) => ({ texto, orden: i + 1 }));

    startTransition(async () => {
      try {
        const c = await crearContrato({
          objeto: String(fd.get("objeto")),
          vigenciaInicio: new Date(String(fd.get("vigenciaInicio"))),
          vigenciaFin: new Date(String(fd.get("vigenciaFin"))),
          valorTotal: Number(fd.get("valorTotal")),
          valorCuota: Number(fd.get("valorCuota")),
          numeroCuotas: Number(fd.get("numeroCuotas")),
          tipoVinculacion: fd.get("tipoVinculacion") as "PROFESIONAL" | "APOYO_GESTION",
          nivelRiesgoArl: fd.get("nivelRiesgoArl") ? Number(fd.get("nivelRiesgoArl")) : undefined,
          obligaciones,
        });
        router.push(`/contratos/${c.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear el contrato");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}>
      <label>
        Objeto
        <textarea name="objeto" rows={3} required />
      </label>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <label style={{ flex: 1 }}>
          Vigencia inicio
          <input name="vigenciaInicio" type="date" required />
        </label>
        <label style={{ flex: 1 }}>
          Vigencia fin
          <input name="vigenciaFin" type="date" required />
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <label style={{ flex: 1 }}>
          Valor total
          <input name="valorTotal" type="number" min="0" step="0.01" required />
        </label>
        <label style={{ flex: 1 }}>
          Valor cuota
          <input name="valorCuota" type="number" min="0" step="0.01" required />
        </label>
        <label style={{ flex: 1 }}>
          N.º cuotas
          <input name="numeroCuotas" type="number" min="1" required />
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <label style={{ flex: 1 }}>
          Tipo de vinculación
          <select name="tipoVinculacion" required>
            <option value="PROFESIONAL">Profesional</option>
            <option value="APOYO_GESTION">Apoyo a la gestión</option>
          </select>
        </label>
        <label style={{ flex: 1 }}>
          Nivel riesgo ARL (1-5)
          <input name="nivelRiesgoArl" type="number" min="1" max="5" />
        </label>
      </div>
      <label>
        Obligaciones (una por línea)
        <textarea name="obligaciones" rows={5} required />
      </label>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear contrato"}
      </button>
    </form>
  );
}
