"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cambiarEstadoTenant,
  actualizarVencimiento,
  vaciarDatosTenant,
  eliminarTenant,
} from "@/modules/tenants/actions";

export function VencimientoForm({
  id,
  valor,
}: {
  id: string;
  valor: string; // yyyy-mm-dd o ""
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fecha = String(fd.get("fecha") ?? "");
    setMsg(null);
    startTransition(async () => {
      const res = await actualizarVencimiento(id, fecha || null);
      setMsg(res.ok ? "Guardado." : res.error);
      router.refresh();
    });
  }

  return (
    <form onSubmit={guardar} className="form-card">
      <label>
        Fecha de vencimiento del servicio
        <input type="date" name="fecha" defaultValue={valor} />
      </label>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0.5rem 0 1rem" }}>
        Si la fecha pasa, la entidad queda <b>en mora</b> y sus usuarios no podrán iniciar sesión
        (suspensión automática). Deja el campo vacío para no tener vencimiento.
      </p>
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar vencimiento"}
      </button>
      {msg && <span style={{ marginLeft: "0.75rem", color: "var(--muted)" }}>{msg}</span>}
    </form>
  );
}

export function AccionesTenant({
  id,
  nombre,
  slug,
  activo,
}: {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function toggleSuspension() {
    startTransition(async () => {
      await cambiarEstadoTenant(id, !activo);
      router.refresh();
    });
  }

  function vaciar() {
    if (
      !window.confirm(
        `¿Vaciar TODOS los datos de "${nombre}" (contratos, cuentas, informes, actas y plantillas)?\n\nLa entidad y sus usuarios se conservan. Esta acción no se puede deshacer.`,
      )
    )
      return;
    setMsg(null);
    startTransition(async () => {
      const res = await vaciarDatosTenant(id);
      setMsg(res.ok ? "Datos de la entidad vaciados." : res.error);
      router.refresh();
    });
  }

  function eliminar() {
    const escrito = window.prompt(
      `Esto ELIMINA la entidad "${nombre}" y TODOS sus datos y usuarios. Es irreversible.\n\nPara confirmar, escribe el identificador: ${slug}`,
    );
    if (escrito !== slug) {
      if (escrito !== null) window.alert("El identificador no coincide. Cancelado.");
      return;
    }
    startTransition(async () => {
      const res = await eliminarTenant(id);
      if (res.ok) router.push("/superadmin/tenants");
      else setMsg(res.error);
    });
  }

  return (
    <div className="form-card">
      {msg && <div className="alert ok">{msg}</div>}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-ghost" onClick={toggleSuspension} disabled={pending}>
          {activo ? "Suspender entidad" : "Reactivar entidad"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ borderColor: "#fde68a", color: "#b45309" }}
          onClick={vaciar}
          disabled={pending}
        >
          Vaciar base de datos
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ borderColor: "#fecaca", color: "#b91c1c" }}
          onClick={eliminar}
          disabled={pending}
        >
          Eliminar entidad
        </button>
      </div>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 0 }}>
        <b>Suspender</b>: bloquea el acceso de los usuarios (reversible). · <b>Vaciar</b>: borra los
        datos operativos, conserva la entidad y usuarios. · <b>Eliminar</b>: borra todo y la entidad
        (irreversible).
      </p>
    </div>
  );
}
