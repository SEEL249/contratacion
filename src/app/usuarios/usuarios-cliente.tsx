"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearUsuario, cambiarEstadoUsuario } from "@/modules/usuarios/actions";
import { ROLES_ASIGNABLES } from "@/modules/usuarios/schema";

const ROLE_LABEL: Record<string, string> = {
  ADMIN_TENANT: "Administrador de entidad",
  PERSONA_CONTRATACION: "Persona de contratación",
  SUPERVISOR: "Supervisor",
  CONTRATISTA: "Contratista",
};

export function NuevoUsuario() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const res = await crearUsuario({
        nombre: String(fd.get("nombre") ?? ""),
        email: String(fd.get("email") ?? ""),
        role: String(fd.get("role") ?? "CONTRATISTA") as (typeof ROLES_ASIGNABLES)[number],
        cedula: String(fd.get("cedula") ?? ""),
        password: String(fd.get("password") ?? ""),
      });
      if (res.ok) {
        setOk(true);
        form.reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form className="form-card" onSubmit={onSubmit}>
      {error && <div className="alert err">{error}</div>}
      {ok && <div className="alert ok">Usuario creado correctamente.</div>}

      <div className="form-grid">
        <label>
          Nombre completo
          <input name="nombre" placeholder="Nombre y apellido" required />
        </label>
        <label>
          Correo
          <input name="email" type="email" placeholder="usuario@entidad.gov.co" required />
        </label>
        <label>
          Rol
          <select name="role" defaultValue="CONTRATISTA">
            {ROLES_ASIGNABLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cédula (solo contratista)
          <input name="cedula" placeholder="1098765432" />
        </label>
        <label>
          Contraseña inicial
          <input name="password" type="password" placeholder="Mínimo 8 caracteres" required />
        </label>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}

export function ToggleEstado({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await cambiarEstadoUsuario(id, !activo);
      router.refresh();
    });
  }

  return (
    <button type="button" className="logout" onClick={toggle} disabled={pending}>
      {pending ? "…" : activo ? "Desactivar" : "Activar"}
    </button>
  );
}
