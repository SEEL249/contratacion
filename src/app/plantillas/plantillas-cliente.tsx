"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cargarPlantillasPorDefecto, cambiarEstadoPlantilla } from "@/modules/plantillas/actions";

export function CargarDefecto() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function cargar() {
    setMsg(null);
    startTransition(async () => {
      const res = await cargarPlantillasPorDefecto();
      if (res.ok) {
        setMsg({ ok: true, text: res.mensaje ?? "Plantillas cargadas." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div>
      {msg && <div className={`alert ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
      <button type="button" className="btn btn-primary" onClick={cargar} disabled={pending}>
        {pending ? "Cargando…" : "Cargar plantillas por defecto"}
      </button>
    </div>
  );
}

export function TogglePlantilla({ id, activa }: { id: string; activa: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await cambiarEstadoPlantilla(id, !activa);
      router.refresh();
    });
  }

  return (
    <button type="button" className="logout" onClick={toggle} disabled={pending}>
      {pending ? "…" : activa ? "Desactivar" : "Activar"}
    </button>
  );
}
