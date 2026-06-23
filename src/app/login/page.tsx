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
    <main>
      <h1>Iniciar sesión</h1>
      <form action={login} style={{ display: "grid", gap: "0.75rem", maxWidth: 360 }}>
        <label>
          Entidad (slug)
          <input name="tenantSlug" placeholder="alcaldia-demo" />
        </label>
        <label>
          Correo
          <input name="email" type="email" required />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" required />
        </label>
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
