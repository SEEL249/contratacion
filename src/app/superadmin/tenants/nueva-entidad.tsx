"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearTenant } from "@/modules/tenants/actions";

// Formulario de alta de entidad (cliente). Llama a la Server Action y refresca.

export function NuevaEntidad() {
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
      const res = await crearTenant({
        nombre: String(fd.get("nombre") ?? ""),
        slug: String(fd.get("slug") ?? ""),
        nit: String(fd.get("nit") ?? ""),
        adminNombre: String(fd.get("adminNombre") ?? ""),
        adminEmail: String(fd.get("adminEmail") ?? ""),
        adminPassword: String(fd.get("adminPassword") ?? ""),
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
      {ok && <div className="alert ok">Entidad creada correctamente.</div>}

      <div className="form-grid">
        <label>
          Nombre de la entidad
          <input name="nombre" placeholder="Alcaldía de Ejemplo" required />
        </label>
        <label>
          Identificador (slug)
          <input name="slug" placeholder="alcaldia-ejemplo" required />
        </label>
        <label>
          NIT (opcional)
          <input name="nit" placeholder="900123456-7" />
        </label>
        <label>
          Nombre del administrador
          <input name="adminNombre" placeholder="Nombre y apellido" required />
        </label>
        <label>
          Correo del administrador
          <input name="adminEmail" type="email" placeholder="admin@entidad.gov.co" required />
        </label>
        <label>
          Contraseña inicial
          <input name="adminPassword" type="password" placeholder="Mínimo 8 caracteres" required />
        </label>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear entidad"}
        </button>
      </div>
    </form>
  );
}
