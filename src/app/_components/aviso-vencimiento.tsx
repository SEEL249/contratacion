"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Aviso emergente de finalización de contrato (90 días de antelación), al iniciar
// el aplicativo. Una vez por sesión del navegador.
//  - modo "tenant": un solo aviso (la entidad del usuario).
//  - modo "superadmin": lista de entidades con contrato por finalizar.

export interface AvisoItem {
  nombre: string;
  dias: number;
  fecha: string;
}

export function AvisoVencimiento({
  modo,
  avisos,
}: {
  modo: "tenant" | "superadmin";
  avisos: AvisoItem[];
}) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!avisos.length) return;
    if (pathname === "/" || pathname.startsWith("/login")) return;
    const key = "avisoFinContratoVisto";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setVisible(true);
  }, [avisos.length, pathname]);

  if (!visible || !avisos.length) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: modo === "superadmin" ? 520 : 440 }}>
        <div className="modal-ic" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4 M12 17h.01" />
          </svg>
        </div>

        {modo === "tenant" ? (
          <>
            <h2>Contrato próximo a finalizar</h2>
            <p>
              El contrato de servicio de tu entidad finaliza en <b>{avisos[0].dias} día
              {avisos[0].dias === 1 ? "" : "s"}</b> ({avisos[0].fecha}). Gestiona con tu entidad la
              renovación para no perder el acceso a la plataforma.
            </p>
          </>
        ) : (
          <>
            <h2>Contratos próximos a finalizar</h2>
            <p>
              {avisos.length} entidad{avisos.length === 1 ? "" : "es"} con contrato por finalizar en
              los próximos 90 días:
            </p>
            <ul style={{ textAlign: "left", margin: "0 0 1.25rem", paddingLeft: "1.1rem", color: "var(--muted)", fontSize: "0.9rem" }}>
              {avisos.slice(0, 8).map((a) => (
                <li key={a.nombre}>
                  <b style={{ color: "var(--text)" }}>{a.nombre}</b> — {a.dias} día{a.dias === 1 ? "" : "s"} ({a.fecha})
                </li>
              ))}
              {avisos.length > 8 && <li>y {avisos.length - 8} más…</li>}
            </ul>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={() => setVisible(false)}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
