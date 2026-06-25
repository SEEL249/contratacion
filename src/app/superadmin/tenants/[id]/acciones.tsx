"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cambiarEstadoTenant,
  actualizarContrato,
  vaciarDatosTenant,
  eliminarTenant,
} from "@/modules/tenants/actions";

export function ContratoForm({
  id,
  inicio,
  fin,
}: {
  id: string;
  inicio: string; // yyyy-mm-dd o ""
  fin: string; // yyyy-mm-dd o ""
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const res = await actualizarContrato({
        id,
        fechaInicioContrato: String(fd.get("fechaInicioContrato") ?? "") || null,
        fechaFinContrato: String(fd.get("fechaFinContrato") ?? ""),
      });
      setMsg(res.ok ? { ok: true, text: "Vigencia del contrato actualizada." } : { ok: false, text: res.error });
      router.refresh();
    });
  }

  return (
    <form onSubmit={guardar} className="form-card">
      {msg && <div className={`alert ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
      <div className="form-grid">
        <label>
          Inicio del contrato
          <input type="date" name="fechaInicioContrato" defaultValue={inicio} />
        </label>
        <label>
          Fin del contrato (vigencia)
          <input type="date" name="fechaFinContrato" defaultValue={fin} required />
        </label>
      </div>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0.75rem 0 1rem" }}>
        La entidad permanece habilitada mientras el contrato esté vigente. Al pasar la fecha de fin,
        se <b>suspende automáticamente</b> el acceso de todos sus usuarios. Para renovar, actualiza
        la fecha de fin con la nueva vigencia adjudicada.
      </p>
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar vigencia"}
      </button>
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

  function toggleHabilitacion() {
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
        <button type="button" className="btn btn-ghost" onClick={toggleHabilitacion} disabled={pending}>
          {activo ? "Deshabilitar entidad" : "Habilitar entidad"}
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
        <b>Deshabilitar</b>: bloquea el acceso manualmente (independiente del contrato). ·{" "}
        <b>Vaciar</b>: borra los datos operativos, conserva la entidad y usuarios. ·{" "}
        <b>Eliminar</b>: borra todo y la entidad (irreversible).
      </p>
    </div>
  );
}
