import Link from "next/link";
import { redirect } from "next/navigation";
import { listarCuentasDelContratista } from "@/modules/cuentas-cobro/actions";

const COLOR_ESTADO: Record<string, string> = {
  BORRADOR: "var(--muted)",
  EN_REVISION: "#fbbf24",
  APROBADO: "#34d399",
  RECHAZADO: "#f87171",
};

export default async function CuentasCobroPage() {
  let cuentas;
  try {
    cuentas = await listarCuentasDelContratista();
  } catch {
    redirect("/login");
  }

  return (
    <main>
      <h1>Mis cuentas de cobro</h1>
      <p>
        <Link href="/cuentas-cobro/nueva">+ Crear cuenta de cobro</Link>
      </p>
      {cuentas.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Aún no hay cuentas de cobro.</p>
      ) : (
        <ul>
          {cuentas.map((c) => (
            <li key={c.id} style={{ marginBottom: "0.5rem" }}>
              <Link href={`/cuentas-cobro/${c.id}`}>
                <b>{c.asignacion.numeroContrato}</b> — cuota {c.numeroCuota}
              </Link>{" "}
              <span style={{ color: COLOR_ESTADO[c.estado] }}>· {c.estado}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
