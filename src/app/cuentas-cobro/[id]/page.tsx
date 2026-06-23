import { notFound, redirect } from "next/navigation";
import { obtenerCuentaCobro } from "@/modules/cuentas-cobro/actions";
import CuentaCliente from "./cuenta-cliente";
import AnexosCliente from "./anexos-cliente";

export default async function CuentaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let cuenta;
  try {
    cuenta = await obtenerCuentaCobro(id);
  } catch {
    redirect("/login");
  }
  if (!cuenta) notFound();

  const contrato = cuenta.asignacion.contrato;
  const ejecutadas =
    cuenta.informe?.obligacionesEjecutadas.map((o) => ({
      id: o.id,
      obligacionTexto: o.obligacionContrato.texto,
      descripcionContratista: o.descripcionContratista,
      descripcionAmpliada: o.descripcionAmpliada,
      evidencias: o.evidencias.length,
    })) ?? [];

  return (
    <main>
      <h1>
        Cuenta de cobro — {cuenta.asignacion.numeroContrato} (cuota {cuenta.numeroCuota})
      </h1>
      <p style={{ color: "var(--muted)" }}>
        {cuenta.nombreContratista} · C.C. {cuenta.cedulaContratista} · {cuenta.tipoVinculacion} ·{" "}
        Estado: {cuenta.estado}
      </p>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        Seguridad social: {cuenta.plataformaSeguridadSocial} · planilla {cuenta.numeroPlanilla}
      </p>

      <p style={{ fontSize: "0.9rem" }}>
        <b>Descargar PDF:</b>{" "}
        <a href={`/api/documentos?tipo=cuenta-cobro&cuentaId=${cuenta.id}`} target="_blank">
          Cuenta de cobro
        </a>{" "}
        ·{" "}
        <a href={`/api/documentos?tipo=informe&cuentaId=${cuenta.id}`} target="_blank">
          Informe de actividades
        </a>
        {cuenta.informe?.supervision && (
          <>
            {" "}·{" "}
            <a href={`/api/documentos?tipo=supervision&cuentaId=${cuenta.id}`} target="_blank">
              Supervisión
            </a>
          </>
        )}
      </p>

      {cuenta.informe?.supervision && (
        <details>
          <summary>Informe de supervisión (3ª persona)</summary>
          <p style={{ whiteSpace: "pre-wrap" }}>{cuenta.informe.supervision.contenido}</p>
        </details>
      )}

      <CuentaCliente
        cuentaId={cuenta.id}
        contratoId={contrato.id}
        estado={cuenta.estado}
        obligaciones={contrato.obligaciones.map((o) => ({ id: o.id, texto: o.texto }))}
        ejecutadas={ejecutadas}
        tieneSupervision={!!cuenta.informe?.supervision}
      />

      <AnexosCliente
        cuentaId={cuenta.id}
        contratoId={contrato.id}
        editable={cuenta.estado === "BORRADOR"}
        anexos={cuenta.documentosAnexos.map((d) => ({
          id: d.id,
          tipo: d.tipo,
          nombre: d.nombre,
          blobUrl: d.blobUrl,
        }))}
      />
    </main>
  );
}
