"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarObligacionEjecutada, generarSupervision } from "@/modules/informes/actions";
import { enviarARevision } from "@/modules/cuentas-cobro/actions";

interface Obligacion {
  id: string;
  texto: string;
}
interface Ejecutada {
  id: string;
  obligacionTexto: string;
  descripcionContratista: string;
  descripcionAmpliada: string | null;
  evidencias: number;
}

const TIPO_POR_MIME = (mime: string): "IMAGEN" | "PDF" | "DOC" | "TXT" | "VIDEO" => {
  if (mime.startsWith("image/")) return "IMAGEN";
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime === "text/plain") return "TXT";
  return "DOC";
};

export default function CuentaCliente({
  cuentaId,
  contratoId,
  estado,
  obligaciones,
  ejecutadas,
  tieneSupervision,
}: {
  cuentaId: string;
  contratoId: string;
  estado: string;
  obligaciones: Obligacion[];
  ejecutadas: Ejecutada[];
  tieneSupervision: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const editable = estado === "BORRADOR";

  async function onRegistrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const file = fd.get("evidencia");
    if (!(file instanceof File) || file.size === 0) {
      setError("La evidencia es obligatoria");
      return;
    }

    setSubiendo(true);
    try {
      // 1) Subir evidencia.
      const up = new FormData();
      up.append("file", file);
      up.append("contratoId", contratoId);
      up.append("cuentaId", cuentaId);
      up.append("carpeta", "evidencias");
      const res = await fetch("/api/upload", { method: "POST", body: up });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al subir evidencia");
      const ev = await res.json();

      // 2) Registrar obligación + ampliación IA.
      await registrarObligacionEjecutada({
        cuentaCobroId: cuentaId,
        obligacionContratoId: String(fd.get("obligacionId")),
        descripcionContratista: String(fd.get("descripcion")),
        ampliarConIa: fd.get("ampliar") === "on",
        evidencias: [
          {
            tipo: TIPO_POR_MIME(ev.mimeType),
            blobUrl: ev.url,
            nombre: ev.nombre,
            mimeType: ev.mimeType,
            tamanoBytes: ev.tamanoBytes,
          },
        ],
      });
      formEl.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setSubiendo(false);
    }
  }

  function accion(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div>
      <h2>Obligaciones ejecutadas</h2>
      {ejecutadas.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Aún no hay obligaciones reportadas.</p>
      ) : (
        <ul>
          {ejecutadas.map((o) => (
            <li key={o.id} style={{ marginBottom: "0.75rem" }}>
              <b>{o.obligacionTexto}</b> · {o.evidencias} evidencia(s)
              <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                {o.descripcionAmpliada ? "✓ Ampliada por IA" : o.descripcionContratista.slice(0, 80)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <>
          <h3>Reportar obligación</h3>
          <form onSubmit={onRegistrar} style={{ display: "grid", gap: "0.5rem", maxWidth: 560 }}>
            <select name="obligacionId" required>
              <option value="">— seleccionar obligación —</option>
              {obligaciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.texto.slice(0, 70)}
                </option>
              ))}
            </select>
            <textarea name="descripcion" rows={3} placeholder="Describa lo ejecutado…" required />
            <label>
              Evidencia (obligatoria): <input name="evidencia" type="file" required />
            </label>
            <label>
              <input name="ampliar" type="checkbox" defaultChecked /> Ampliar y corregir con IA
            </label>
            <button type="submit" disabled={subiendo}>
              {subiendo ? "Procesando…" : "Registrar obligación"}
            </button>
          </form>

          <h3 style={{ marginTop: "1.5rem" }}>Acciones</h3>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => accion(() => generarSupervision(cuentaId))} disabled={pending}>
              {tieneSupervision ? "Regenerar" : "Generar"} informe de supervisión
            </button>
            <button onClick={() => accion(() => enviarARevision(cuentaId))} disabled={pending}>
              Enviar a revisión
            </button>
          </div>
        </>
      )}

      {error && <p style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}
