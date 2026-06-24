import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth/session";
import { listarTenants } from "@/modules/tenants/actions";
import { estadoTenant, ESTADO_LABEL, ESTADO_PILL } from "@/lib/tenants/estado";
import { PLAN_LABEL, type Plan } from "@/lib/tenants/plan";
import { NuevaEntidad } from "./nueva-entidad";

// Pantalla SUPERADMIN: gestión de entidades (tenants). Lista las entidades
// existentes y permite crear una nueva con su primer administrador.

export const dynamic = "force-dynamic";

function fecha(d: Date | null) {
  return d ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(d) : "—";
}

export default async function GestionEntidadesPage() {
  try {
    await requireSuperadmin();
  } catch {
    redirect("/login");
  }

  const tenants = await listarTenants();

  return (
    <main>
      <div className="crumbs">
        <Link href="/dashboard">Panel</Link> / Gestionar entidades
      </div>

      <div className="page-head">
        <h1>Gestión de entidades</h1>
        <p>
          Crea y administra las entidades (alcaldías, personerías, etc.) que usan la plataforma.
          Cada entidad es un espacio aislado con sus propios usuarios, contratos y documentos.
        </p>
      </div>

      <div className="section-sep">Entidades registradas ({tenants.length})</div>

      {tenants.length === 0 ? (
        <div className="form-card" style={{ color: "var(--muted)" }}>
          Aún no hay entidades. Crea la primera con el formulario de abajo.
        </div>
      ) : (
        <div className="table-card">
          <table className="data">
            <thead>
              <tr>
                <th>Entidad</th>
                <th>Identificador</th>
                <th>Plan</th>
                <th>Usuarios</th>
                <th>Contratos</th>
                <th>Estado</th>
                <th>Vence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const estado = estadoTenant(t);
                return (
                  <tr key={t.id}>
                    <td>{t.nombre}</td>
                    <td>
                      <span className="mono">{t.slug}</span>
                    </td>
                    <td>{PLAN_LABEL[t.plan as Plan]}</td>
                    <td>{t._count.users}</td>
                    <td>{t._count.contratos}</td>
                    <td>
                      <span className={ESTADO_PILL[estado]}>{ESTADO_LABEL[estado]}</span>
                    </td>
                    <td>{fecha(t.fechaVencimiento)}</td>
                    <td>
                      <Link href={`/superadmin/tenants/${t.id}`} className="logout">
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-sep">Crear nueva entidad</div>
      <p style={{ color: "var(--muted)", marginTop: "-0.5rem", marginBottom: "1.25rem" }}>
        Se creará la entidad junto con su <b>primer administrador</b> (rol ADMIN_TENANT), quien luego
        podrá crear el resto de usuarios y plantillas desde su propio panel.
      </p>
      <NuevaEntidad />
    </main>
  );
}
