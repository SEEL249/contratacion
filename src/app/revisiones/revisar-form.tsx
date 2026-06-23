"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revisar } from "@/modules/revisiones/actions";

export default function RevisarForm({ cuentaCobroId }: { cuentaCobroId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [obs, setObs] = useState("");

  function ejecutar(accion: "APROBAR" | "RECHAZAR") {
    setError(null);
    startTransition(async () => {
      try {
        await revisar({ cuentaCobroId, accion, observaciones: obs || undefined });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem", maxWidth: 480 }}>
      <textarea
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        rows={2}
        placeholder="Observaciones (obligatorias al rechazar)"
      />
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={() => ejecutar("APROBAR")} disabled={pending}>
          Aprobar
        </button>
        <button onClick={() => ejecutar("RECHAZAR")} disabled={pending}>
          Rechazar
        </button>
      </div>
      {error && <p style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}
