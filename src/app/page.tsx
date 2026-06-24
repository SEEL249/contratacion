import Link from "next/link";
import { auth } from "@/lib/auth/auth";

const features = [
  {
    title: "Contratos multi-contratista",
    desc: "Creación de contratos con obligaciones, asignación a varios contratistas y ampliaciones controladas.",
    icon: (
      <path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M14 4v6h6 M7 13h8 M7 17h6" />
    ),
  },
  {
    title: "Informes con IA",
    desc: "Redacción asistida por IA y generación automática de la supervisión en tercera persona.",
    icon: <path d="M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />,
  },
  {
    title: "Cuentas de cobro",
    desc: "Generación 1:1 con cada cuota, con snapshot del contrato, evidencias y planilla de seguridad social (PILA).",
    icon: <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M3 10h18 M7 15h4" />,
  },
  {
    title: "Actas y documentos",
    desc: "Actas inicial, parcial y final renderizadas desde plantillas, con exportación a PDF.",
    icon: <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z M14 2v6h6 M9 13l2 2 4-4" />,
  },
  {
    title: "Revisión y aprobación",
    desc: "Flujo de aprobación/rechazo con observaciones obligatorias y notificación automática por correo.",
    icon: <path d="M9 12l2 2 4-4 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  },
  {
    title: "Multi-tenant seguro",
    desc: "Aislamiento de datos por entidad y control de acceso por roles (RBAC) en cada operación.",
    icon: <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z M9 12l2 2 4-4" />,
  },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="home">
      <div className="wrap">
        <header className="nav">
          <div className="brand">
            <span className="logo" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z" />
              </svg>
            </span>
            <span>
              Contratación <small>· OSS</small>
            </span>
          </div>
          <nav>
            {session?.user ? (
              <Link className="btn btn-ghost" href="/dashboard">
                Ir al panel
              </Link>
            ) : (
              <Link className="btn btn-ghost" href="/login">
                Iniciar sesión
              </Link>
            )}
          </nav>
        </header>
      </div>

      <div className="wrap">
        <section className="hero-banner">
          <h1 className="sr-only">Gestión Integral de Contratistas del Sector Público</h1>
          <img
            className="hero-img"
            src="/hero-bg.png"
            alt="Gestión Integral de Contratistas del Sector Público — selección, contratación, seguimiento, evaluación y resultados."
          />
          <div className="hero-cta">
            {session?.user ? (
              <Link className="btn btn-primary" href="/dashboard">
                Ir al panel →
              </Link>
            ) : (
              <Link className="btn btn-primary" href="/login">
                Iniciar sesión →
              </Link>
            )}
            <a className="btn btn-ghost" href="#modulos">
              Conocer los módulos
            </a>
          </div>
          {session?.user && (
            <p className="session-note">
              Sesión activa como <b>{session.user.name}</b> · {session.user.role}
            </p>
          )}
        </section>
      </div>

      <div className="wrap">
        <div className="section-head" id="modulos">
          <h2>Todo el ciclo de contratación en un lugar</h2>
          <p>Diseñado para entidades públicas: cumplimiento, control de roles y evidencia en cada paso.</p>
        </div>

        <section className="features">
          {features.map((f) => (
            <article key={f.title} className="feature">
              <span className="ic" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {f.icon}
                </svg>
              </span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </section>

        <footer className="footer">
          <span>© {new Date().getFullYear()} Open Source Solutions (OSS)</span>
          <span>Plataforma de gestión de contratos del sector público</span>
        </footer>
      </div>
    </div>
  );
}
