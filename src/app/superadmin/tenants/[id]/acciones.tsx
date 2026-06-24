"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cambiarEstadoTenant,
  cambiarPlan,
  registrarPago,
  vaciarDatosTenant,
  eliminarTenant,
} from "@/modules/tenants/actions";

export function PlanYPago({ id, plan }: { id: string; plan: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function guardarPlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nuevo = String(fd.get("plan") ?? plan);
    setMsg(null);
    startTransition(async () => {
      const res = await cambiarPlan(id, nuevo);
      setMsg(res.ok ? "Plan actualizado; vencimiento recalculado." : res.error);
      router.refresh();
    });
  }

  function pagar() {
    if (!window.confirm("¿Registrar un pago? Renueva el servicio un periodo del plan y reactiva la entidad.")) return;
    setMsg(null);
    startTransition(async () => {
      const res = await registrarPago(id);
      setMsg(res.ok ? "Pago registrado: servicio renovado y entidad reactivada." : res.error);
      router.refresh();
    });
  }

  return (
    <div className="form-card">
      {msg && <div className="alert ok">{msg}</div>}
      <form onSubmit={guardarPlan}>
        <label>
          Plan de suscripción
          <select name="plan" defaultValue={plan}>
            <option value="MENSUAL">Mensual</option>
            <option value="TRIMESTRAL">Trimestral</option>
            <option value="SEMESTRAL">Semestral</option>
            <option value="ANUAL">Anual</option>
          </select>
        </label>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0.5rem 0 1rem" }}>
          El vencimiento se calcula a partir de la fecha de creación según el plan. Al cambiar el
          plan se recalcula. Cuando el vencimiento pasa, la entidad entra en <b>mora</b> y se
          suspende automáticamente.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar plan"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={pagar} disabled={pending}>
            Registrar pago (renovar)
          </button>
        </div>
      </form>
    </div>
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
