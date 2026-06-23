import { redirect } from "next/navigation";
import { listarAsignacionesDelContratista } from "@/modules/cuentas-cobro/actions";
import NuevaCuentaForm from "./form";

export default async function NuevaCuentaPage() {
  let asignaciones;
  try {
    asignaciones = await listarAsignacionesDelContratista();
  } catch {
    redirect("/login");
  }

  const opciones = asignaciones.map((a) => ({
    id: a.id,
    numeroContrato: a.numeroContrato,
    objeto: a.contrato.objeto,
    numeroCuotas: a.contrato.numeroCuotas,
    cuotasUsadas: a.cuentasCobro.length,
    tipoVinculacion: a.contrato.tipoVinculacion,
  }));

  return (
    <main>
      <h1>Crear cuenta de cobro</h1>
      <NuevaCuentaForm asignaciones={opciones} />
    </main>
  );
}
