"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { asignarContratistas } from "@/modules/contratos/actions";

interface Opcion {
  id: string;
  nombre: string;
  cedula?: string | null;
}

interface Fila {
  contratistaId: string;
  numeroContrato: string;
  supervisorId: string;
}

// Asignación de uno o varios contratistas al contrato base. Cada fila lleva su
// propio número de contrato (diferenciador).
export default function AsignarForm({
  contratoId,
  contratistas,
  supervisores,
}: {
  contratoId: string;
  contratistas: Opcion[];
  supervisores: Opcion[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [filas, setFilas] = useState<Fila[]>([
    { contratistaId: "", numeroContrato: "", supervisorId: "" },
  ]);

  function update(i: number, campo: keyof Fila, valor: string) {
    setFilas((f) => f.map((fila, idx) => (idx === i ? { ...fila, [campo]: valor } : fila)));
  }

  function addFila() {
    setFilas((f) => [...f, { contratistaId: "", numeroContrato: "", supervisorId: "" }]);
  }

  function removeFila(i: number) {
    setFilas((f) => f.filter((_, idx) => idx !== i));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await asignarContratistas({
          contratoId,
          asignaciones: filas.map((f) => ({
            contratistaId: f.contratistaId,
            numeroContrato: f.numeroContrato,
            supervisorId: f.supervisorId || undefined,
          })),
        });
        router.refresh();
        setFilas([{ contratistaId: "", numeroContrato: "", supervisorId: "" }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al asignar");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
      {filas.map((fila, i) => (
        <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "end" }}>
          <label style={{ flex: 2 }}>
            Contratista
            <select
              value={fila.contratistaId}
              onChange={(e) => update(i, "contratistaId", e.target.value)}
              required
            >
              <option value="">— seleccionar —</option>
              {contratistas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.cedula ? `(${c.cedula})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label style={{ flex: 1 }}>
            N.º contrato
            <input
              value={fila.numeroContrato}
              onChange={(e) => update(i, "numeroContrato", e.target.value)}
              placeholder="CPS-2026-001"
              required
            />
          </label>
          <label style={{ flex: 2 }}>
            Supervisor
            <select value={fila.supervisorId} onChange={(e) => update(i, "supervisorId", e.target.value)}>
              <option value="">— sin asignar —</option>
              {supervisores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          {filas.length > 1 && (
            <button type="button" onClick={() => removeFila(i)}>
              ✕
            </button>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" onClick={addFila}>
          + Agregar contratista
        </button>
        <button type="submit" disabled={pending}>
          {pending ? "Asignando…" : "Asignar"}
        </button>
      </div>
      {error && <p style={{ color: "#f87171" }}>{error}</p>}
    </form>
  );
}
