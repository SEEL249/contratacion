import { notFound, redirect } from "next/navigation";
import {
  obtenerContrato,
  listarUsuariosPorRol,
} from "@/modules/contratos/actions";
import AsignarForm from "./asignar-form";

export default async function ContratoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let contrato, contratistas, supervisores;
  try {
    [contrato, contratistas, supervisores] = await Promise.all([
      obtenerContrato(id),
      listarUsuariosPorRol("CONTRATISTA"),
      listarUsuariosPorRol("SUPERVISOR"),
    ]);
  } catch {
    redirect("/login");
  }
  if (!contrato) notFound();

  return (
    <main>
      <h1>{contrato.objeto}</h1>
      <p style={{ color: "var(--muted)" }}>
        {contrato.tipoVinculacion} · Valor total {String(contrato.valorTotal)} ·{" "}
        {contrato.numeroCuotas} cuotas de {String(contrato.valorCuota)}
      </p>

      <h2>Obligaciones</h2>
      <ol>
        {contrato.obligaciones.map((o) => (
          <li key={o.id}>{o.texto}</li>
        ))}
      </ol>

      <h2>Contratistas asignados</h2>
      {contrato.asignaciones.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Sin asignaciones aún.</p>
      ) : (
        <ul>
          {contrato.asignaciones.map((a) => (
            <li key={a.id}>
              <b>{a.numeroContrato}</b> — {a.contratista.nombre}
              {a.supervisor ? ` · supervisor: ${a.supervisor.nombre}` : ""}
            </li>
          ))}
        </ul>
      )}

      <h2>Asignar contratistas</h2>
      <AsignarForm
        contratoId={contrato.id}
        contratistas={contratistas}
        supervisores={supervisores}
      />
    </main>
  );
}
