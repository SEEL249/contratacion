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
      <h1>Informes de supervisión — mes actual</h1>
      {items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No hay informes de supervisión este mes.</p>
      ) : (
        items.map((it, i) => (
          <article key={i} style={{ marginBottom: "1.5rem" }}>
            <h2>
              {it.numeroContrato} — {it.contratista} (cuota {it.cuota})
            </h2>
            <p style={{ color: "var(--muted)" }}>{it.objeto}</p>
            <p style={{ whiteSpace: "pre-wrap" }}>{it.contenido}</p>
          </article>
        ))
      )}
    </main>
  );
}
