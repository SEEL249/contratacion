"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarAnexo, eliminarAnexo } from "@/modules/anexos/actions";

type TipoAnexo = "SEGURIDAD_SOCIAL" | "PARAFISCALES" | "OTRO";

interface Anexo {
  id: string;
  tipo: string;
  nombre: string;
  blobUrl: string;
}

const ETIQUETA: Record<string, string> = {
  SEGURIDAD_SOCIAL: "Planilla seguridad social",
  PARAFISCALES: "Parafiscales",
  OTRO: "Otro",
};

export default function AnexosCliente({
  cuentaId,
  contratoId,
  editable,
  anexos,
}: {
  cuentaId: string;
  contratoId: string;
  editable: boolean;
  anexos: Anexo[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoAnexo>("SEGURIDAD_SOCIAL");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const file = fd.get("archivo");
    if (!(file instanceof File) || file.size === 0) {
      setError("Seleccione un archivo");
      return;
    }
    setBusy(true);
    try {
      const up = new FormData();
      up.append("file", file);
      up.append("contratoId", contratoId);
      up.append("cuentaId", cuentaId);
      up.append("carpeta", "documentos");
      const res = await fetch("/api/upload", { method: "POST", body: up });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al subir");
      const data = await res.json();

      await registrarAnexo({
        cuentaCobroId: cuentaId,
        tipo,
        blobUrl: data.url,
        nombre: data.nombre,
        mimeType: data.mimeType,
        tamanoBytes: data.tamanoBytes,
      });
      formEl.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onEliminar(id: string) {
    setError(null);
    try {
      await eliminarAnexo(id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div>
      <h2>Documentos anexos</h2>
      {anexos.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Sin anexos. La planilla de seguridad social es obligatoria.</p>
      ) : (
        <ul>
          {anexos.map((a) => (
            <li key={a.id}>
              <a href={a.blobUrl} target="_blank" rel="noreferrer">
                [{ETIQUETA[a.tipo] ?? a.tipo}] {a.nombre}
              </a>
              {editable && (
                <button onClick={() => onEliminar(a.id)} style={{ marginLeft: "0.5rem" }}>
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoAnexo)}>
            <option value="SEGURIDAD_SOCIAL">Planilla seguridad social</option>
            <option value="PARAFISCALES">Parafiscales</option>
            <option value="OTRO">Otro</option>
          </select>
          <input name="archivo" type="file" required />
          <button type="submit" disabled={busy}>
            {busy ? "Subiendo…" : "Adjuntar"}
          </button>
        </form>
      )}
      {error && <p style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}
