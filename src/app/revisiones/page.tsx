import Link from "next/link";
import { redirect } from "next/navigation";
import { listarPendientesDeRevision } from "@/modules/revisiones/actions";
import RevisarForm from "./revisar-form";

export default async function RevisionesPage() {
  let cuentas;
  try {
    cuentas = await listarPendientesDeRevision();
  } catch {
    redirect("/login");
  }

  return (
    <main>
      <div className="crumbs">
        <Link href="/dashboard">Panel</Link> / Revisiones
      </div>
      <div className="page-head">
        <h1>Revisiones pendientes</h1>
        <p>Cuentas de cobro enviadas a revisión, a la espera de aprobación o rechazo.</p>
      </div>

      {cuentas.length === 0 ? (
        <div className="form-card" style={{ color: "var(--muted)" }}>No hay cuentas en revisión.</div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {cuentas.map((c) => (
            <article key={c.id} className="form-card">
              <h3 style={{ marginTop: 0 }}>
                {c.asignacion.numeroContrato} — cuota {c.numeroCuota}
              </h3>
              <p style={{ color: "var(--muted)", marginTop: 0 }}>
                {c.asignacion.contratista.nombre} · {c.asignacion.contrato.objeto.slice(0, 90)}
              </p>
              <RevisarForm cuentaCobroId={c.id} />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
