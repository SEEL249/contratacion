import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth/auth";

// Login con credenciales. El tenantSlug identifica la entidad (dejar vacío para
// SUPERADMIN). Server Action -> Auth.js. Ver src/lib/auth/auth.ts.

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      tenantSlug: formData.get("tenantSlug") || undefined,
      redirectTo: "/dashboard",
    });
    redirect("/dashboard");
  }

  return (
    <main className="auth-wrap">
      <div className="card auth-card">
        <h1>Iniciar sesión</h1>
        <p className="sub">Accede al espacio de tu entidad.</p>
        <form action={login} className="auth-form">
          <label>
            Entidad (slug)
            <input name="tenantSlug" placeholder="alcaldia-demo" />
          </label>
          <label>
            Correo
            <input name="email" type="email" placeholder="usuario@entidad.co" required />
          </label>
          <label>
            Contraseña
            <input name="password" type="password" placeholder="••••••••" required />
          </label>
          <button type="submit">Entrar</button>
        </form>
        <p className="auth-hint">
          Deja la entidad vacía solo si eres superadministrador de la plataforma.
        </p>
      </div>
    </main>
  );
}
