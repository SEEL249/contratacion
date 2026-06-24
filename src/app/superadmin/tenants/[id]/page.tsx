import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth/session";
import { obtenerTenant } from "@/modules/tenants/actions";
import { estadoTenant, ESTADO_LABEL, ESTADO_PILL } from "@/lib/tenants/estado";
import { VencimientoForm, AccionesTenant } from "./acciones";

export const dynamic = "force-dynamic";

function fecha(d: Date | null) {
  return d ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(d) : "—";
}
function toInputDate(d: Date | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default async function TenantDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let tenant;
  try {
    await requireSuperadmin();
    tenant = await obtenerTenant(id);
  } catch {
    redirect("/login");
  }
  if (!tenant) notFound();

  const estado = estadoTenant(tenant);

  return (
    <main>
      <div className="crumbs">
        <Link href="/dashboard">Panel</Link> /{" "}
        <Link href="/superadmin/tenants">Entidades</Link> / {tenant.nombre}
      </div>

      <div className="page-head" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>{tenant.nombre}</h1>
        <span className={ESTADO_PILL[estado]}>{ESTADO_LABEL[estado]}</span>
      </div>

      <div className="section-sep">Información</div>
      <div className="table-card">
        <table className="data">
          <tbody>
            <tr>
              <th>Identificador (slug)</th>
              <td><span className="mono">{tenant.slug}</span></td>
            </tr>
            <tr>
              <th>NIT</th>
              <td>{tenant.nit ?? "—"}</td>
            </tr>
            <tr>
              <th>Estado</th>
              <td>
                <span className={ESTADO_PILL[estado]}>{ESTADO_LABEL[estado]}</span>
              </td>
            </tr>
            <tr>
              <th>Vence</th>
              <td>{fecha(tenant.fechaVencimiento)}</td>
            </tr>
            <tr>
              <th>Usuarios</th>
              <td>{tenant._count.users}</td>
            </tr>
            <tr>
              <th>Contratos</th>
              <td>{tenant._count.contratos}</td>
            </tr>
            <tr>
              <th>Cuentas de cobro</th>
              <td>{tenant._count.cuentasCobro}</td>
            </tr>
            <tr>
              <th>Plantillas</th>
              <td>{tenant._count.plantillas}</td>
            </tr>
            <tr>
              <th>Actas</th>
              <td>{tenant._count.actas}</td>
            </tr>
            <tr>
              <th>Creada</th>
              <td>{fecha(tenant.createdAt)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section-sep">Vencimiento y mora</div>
      <VencimientoForm id={tenant.id} valor={toInputDate(tenant.fechaVencimiento)} />

      <div className="section-sep">Acciones</div>
      <AccionesTenant id={tenant.id} nombre={tenant.nombre} slug={tenant.slug} activo={tenant.activo} />
    </main>
  );
}
