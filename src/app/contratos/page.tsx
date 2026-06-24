import Link from "next/link";
import { redirect } from "next/navigation";
import { listarContratos } from "@/modules/contratos/actions";

export default async function ContratosPage() {
  let contratos;
  try {
    contratos = await listarContratos();
  } catch {
    redirect("/login");
  }

  return (
    <main>
      <div className="crumbs">
        <Link href="/dashboard">Panel</Link> / Contratos
      </div>
      <div
        className="page-head"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}
      >
        <div>
          <h1>Contratos</h1>
          <p>Contratos de prestación de servicios de la entidad y sus contratistas asignados.</p>
        </div>
        <Link href="/contratos/nuevo" className="btn btn-primary">
          + Nuevo contrato
        </Link>
      </div>

      {contratos.length === 0 ? (
        <div className="form-card" style={{ color: "var(--muted)" }}>Aún no hay contratos. Crea el primero.</div>
      ) : (
        <ul className="list">
          {contratos.map((c) => (
            <li key={c.id}>
              <Link href={`/contratos/${c.id}`}>
                <b>{c.objeto.slice(0, 90)}</b>
              </Link>
              <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                {c.tipoVinculacion} · {c.numeroCuotas} cuotas · {c.asignaciones.length} contratista(s)
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
