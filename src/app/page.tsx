import Link from "next/link";
import { auth } from "@/lib/auth/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main>
      <h1>Gestión de Contratistas del Sector Público</h1>
      <p style={{ color: "var(--muted)" }}>
        Plataforma multi-tenant — Open Source Solutions (OSS)
      </p>

      {session?.user ? (
        <p>
          Sesión iniciada como <b>{session.user.name}</b> ({session.user.role}).{" "}
          <Link href="/dashboard">Ir al panel →</Link>
        </p>
      ) : (
        <p>
          <Link href="/login">Iniciar sesión →</Link>
        </p>
      )}
    </main>
  );
}
