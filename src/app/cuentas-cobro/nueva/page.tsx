import Link from "next/link";
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
      <div className="crumbs">
        <Link href="/dashboard">Panel</Link> / <Link href="/cuentas-cobro">Cuentas de cobro</Link> / Nueva
      </div>
      <div className="page-head">
        <h1>Crear cuenta de cobro</h1>
        <p>Selecciona el contrato y la cuota, y adjunta tus informes y soportes.</p>
      </div>
      <NuevaCuentaForm asignaciones={opciones} />
    </main>
  );
}
