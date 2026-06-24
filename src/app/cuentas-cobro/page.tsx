import Link from "next/link";
import { redirect } from "next/navigation";
import { listarCuentasDelContratista } from "@/modules/cuentas-cobro/actions";

const PILL_ESTADO: Record<string, string> = {
  BORRADOR: "pill",
  EN_REVISION: "pill warn",
  APROBADO: "pill ok",
  RECHAZADO: "pill off",
};
const ESTADO_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
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
      <div className="crumbs">
        <Link href="/dashboard">Panel</Link> / Cuentas de cobro
      </div>
      <div
        className="page-head"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}
      >
        <div>
          <h1>Mis cuentas de cobro</h1>
          <p>Consulta el estado de tus cuentas de cobro y crea nuevas a partir de tus contratos.</p>
        </div>
        <Link href="/cuentas-cobro/nueva" className="btn btn-primary">
          + Crear cuenta de cobro
        </Link>
      </div>

      {cuentas.length === 0 ? (
        <div className="form-card" style={{ color: "var(--muted)" }}>Aún no hay cuentas de cobro.</div>
      ) : (
        <ul className="list">
          {cuentas.map((c) => (
            <li
              key={c.id}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
            >
              <Link href={`/cuentas-cobro/${c.id}`}>
                <b>{c.asignacion.numeroContrato}</b> — cuota {c.numeroCuota}
              </Link>
              <span className={PILL_ESTADO[c.estado] ?? "pill"}>
                {ESTADO_LABEL[c.estado] ?? c.estado}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
