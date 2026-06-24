import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { listarUsuarios } from "@/modules/usuarios/actions";
import { NuevoUsuario, ToggleEstado } from "./usuarios-cliente";

// Pantalla ADMIN_TENANT: gestión de usuarios de la entidad.

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN_TENANT: "Administrador de entidad",
  PERSONA_CONTRATACION: "Persona de contratación",
  SUPERVISOR: "Supervisor",
  CONTRATISTA: "Contratista",
};

function fecha(d: Date) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(d);
}

export default async function UsuariosPage() {
  let usuarios;
  try {
    await requireSession();
    usuarios = await listarUsuarios();
  } catch {
    redirect("/login");
  }

  return (
    <main>
      <div className="crumbs">
        <Link href="/dashboard">Panel</Link> / Usuarios
      </div>

      <div className="page-head">
        <h1>Usuarios de la entidad</h1>
        <p>
          Administra las personas que acceden a la plataforma en tu entidad y el rol con el que
          operan (contratación, supervisión, contratistas y otros administradores).
        </p>
      </div>

      <div className="section-sep">Usuarios registrados ({usuarios.length})</div>

      <div className="table-card">
        <table className="data">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Cédula</th>
              <th>Estado</th>
              <th>Creado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                <td>{u.cedula ?? "—"}</td>
                <td>
                  <span className={`pill ${u.activo ? "ok" : "off"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>{fecha(u.createdAt)}</td>
                <td>
                  <ToggleEstado id={u.id} activo={u.activo} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-sep">Crear nuevo usuario</div>
      <NuevoUsuario />
    </main>
  );
}
