import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { listarPlantillas } from "@/modules/plantillas/actions";
import { CargarDefecto, TogglePlantilla } from "./plantillas-cliente";

// Pantalla ADMIN_TENANT: gestión de plantillas de documentos de la entidad.

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  CONTRATO: "Contrato",
  ACTA_INICIAL: "Acta inicial",
  ACTA_PARCIAL: "Acta parcial",
  ACTA_FINAL: "Acta final",
  CUENTA_COBRO: "Cuenta de cobro",
  PARAFISCALES: "Parafiscales",
};

function fecha(d: Date) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(d);
}

export default async function PlantillasPage() {
  let plantillas;
  try {
    await requireSession();
    plantillas = await listarPlantillas();
  } catch {
    redirect("/login");
  }

  return (
    <main>
      <div className="crumbs">
        <Link href="/dashboard">Panel</Link> / Plantillas
      </div>

      <div className="page-head">
        <h1>Plantillas de documentos</h1>
        <p>
          Formatos institucionales (contrato, actas, cuenta de cobro, parafiscales) con marcadores{" "}
          <span className="mono">{"{{campo}}"}</span> que se rellenan automáticamente al generar
          cada documento.
        </p>
      </div>

      {plantillas.length === 0 ? (
        <div className="form-card">
          <p style={{ marginTop: 0, color: "var(--muted)" }}>
            Tu entidad aún no tiene plantillas. Carga el juego por defecto para empezar; luego podrás
            ajustarlas.
          </p>
          <CargarDefecto />
        </div>
      ) : (
        <>
          <div className="section-sep">Plantillas ({plantillas.length})</div>
          <div className="table-card">
            <table className="data">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Nombre</th>
                  <th>Versión</th>
                  <th>Estado</th>
                  <th>Actualizada</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {plantillas.map((p) => (
                  <tr key={p.id}>
                    <td>{TIPO_LABEL[p.tipo] ?? p.tipo}</td>
                    <td>{p.nombre}</td>
                    <td>v{p.version}</td>
                    <td>
                      <span className={`pill ${p.activa ? "ok" : "off"}`}>
                        {p.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td>{fecha(p.updatedAt)}</td>
                    <td>
                      <TogglePlantilla id={p.id} activa={p.activa} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
