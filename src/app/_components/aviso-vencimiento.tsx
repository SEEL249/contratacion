"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Aviso emergente cuando faltan ≤10 días para el vencimiento por mora.
// Se muestra una vez por sesión del navegador (al iniciar el aplicativo).

export function AvisoVencimiento({
  dias,
  fecha,
}: {
  dias: number | null;
  fecha: string | null;
}) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dias === null) return;
    if (pathname === "/" || pathname.startsWith("/login")) return;
    const key = "avisoVencimientoVisto";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setVisible(true);
  }, [dias, pathname]);

  if (!visible || dias === null) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-ic" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4 M12 17h.01" />
          </svg>
        </div>
        <h2>Tu servicio está por vencer</h2>
        <p>
          Faltan <b>{dias} día{dias === 1 ? "" : "s"}</b> para el vencimiento
          {fecha ? ` (${fecha})` : ""}. Realiza el pago antes de esa fecha para evitar la{" "}
          <b>suspensión automática por mora</b> del acceso de tu entidad.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={() => setVisible(false)}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
