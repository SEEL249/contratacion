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
      <h1>Contratos</h1>
      <p>
        <Link href="/contratos/nuevo">+ Nuevo contrato</Link>
      </p>

      {contratos.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Aún no hay contratos.</p>
      ) : (
        <ul>
          {contratos.map((c) => (
            <li key={c.id} style={{ marginBottom: "0.75rem" }}>
              <Link href={`/contratos/${c.id}`}>
                <b>{c.objeto.slice(0, 80)}</b>
              </Link>
              <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                {c.tipoVinculacion} · {c.numeroCuotas} cuotas · {c.asignaciones.length} contratista(s)
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
