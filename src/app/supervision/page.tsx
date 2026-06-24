import Link from "next/link";
import { redirect } from "next/navigation";
import { listarSupervisionMesActual } from "@/modules/supervision/actions";

export default async function SupervisionPage() {
  let items;
  try {
    items = await listarSupervisionMesActual();
  } catch {
    redirect("/login");
  }

  return (
    <main>
      <div className="crumbs">
        <Link href="/dashboard">Panel</Link> / Supervisión
      </div>
      <div className="page-head">
        <h1>Informes de supervisión — mes actual</h1>
        <p>Informes de supervisión generados para el periodo en curso.</p>
      </div>

      {items.length === 0 ? (
        <div className="form-card" style={{ color: "var(--muted)" }}>No hay informes de supervisión este mes.</div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {items.map((it, i) => (
            <article key={i} className="form-card">
              <h3 style={{ marginTop: 0 }}>
                {it.numeroContrato} — {it.contratista} (cuota {it.cuota})
              </h3>
              <p style={{ color: "var(--muted)", marginTop: 0 }}>{it.objeto}</p>
              <p style={{ whiteSpace: "pre-wrap" }}>{it.contenido}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
