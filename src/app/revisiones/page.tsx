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
      <h1>Revisiones pendientes</h1>
      {cuentas.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No hay cuentas en revisión.</p>
      ) : (
        cuentas.map((c) => (
          <article key={c.id} style={{ marginBottom: "1.5rem", borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
            <h2>
              {c.asignacion.numeroContrato} — cuota {c.numeroCuota}
            </h2>
            <p style={{ color: "var(--muted)" }}>
              {c.asignacion.contratista.nombre} · {c.asignacion.contrato.objeto.slice(0, 80)}
            </p>
            <RevisarForm cuentaCobroId={c.id} />
          </article>
        ))
      )}
    </main>
  );
}
