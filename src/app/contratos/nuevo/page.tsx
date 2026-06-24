import Link from "next/link";
import NuevoContratoForm from "./form";

export default function NuevoContratoPage() {
  return (
    <main>
      <div className="crumbs">
        <Link href="/dashboard">Panel</Link> / <Link href="/contratos">Contratos</Link> / Nuevo
      </div>
      <div className="page-head">
        <h1>Nuevo contrato</h1>
        <p>Define el objeto, valor, cuotas y obligaciones del contrato.</p>
      </div>
      <NuevoContratoForm />
    </main>
  );
}
