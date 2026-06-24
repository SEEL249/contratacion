import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth/auth";

// Login con credenciales. El tenantSlug identifica la entidad (dejar vacío para
// SUPERADMIN). Server Action -> Auth.js. Ver src/lib/auth/auth.ts.
//
// Manejo de errores: signIn lanza AuthError si las credenciales son inválidas;
// se captura y se vuelve a /login?error=1 con un mensaje. En caso de éxito,
// signIn lanza el redirect interno (NEXT_REDIRECT), que se debe propagar.

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const hayError = Boolean(sp?.error);

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        tenantSlug: formData.get("tenantSlug") || undefined,
        redirectTo: "/dashboard",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?error=1");
      }
      throw error; // NEXT_REDIRECT (éxito) u otros: propagar
    }
  }

  return (
    <main className="auth-wrap">
      <div className="card auth-card">
        <div className="auth-brand">
          <span className="logo" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z" />
            </svg>
          </span>
          <span>
            Contratación <small style={{ color: "var(--muted)", fontWeight: 500 }}>· Sector Público</small>
          </span>
        </div>
        <h1>Iniciar sesión</h1>
        <p className="sub">Accede al espacio de tu entidad.</p>

        {hayError && (
          <div className="alert err">
            Credenciales inválidas. Verifica el correo, la contraseña y la <b>entidad</b>.
          </div>
        )}

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
          Deja la entidad vacía solo si eres superadministrador de la plataforma. Para usuarios de
          una entidad, el campo <b>Entidad (slug)</b> es obligatorio (p. ej. <span className="mono">alcaldia-demo</span>).
        </p>
      </div>
    </main>
  );
}
