// Servicio de correo. Proveedor: Resend (ver docs/03-rfc-arquitectura.md §7).
// Notificaciones del flujo de revisión: aprobación y rechazo con observaciones.

interface SendMailArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "no-reply@oss.example.co";

  if (!apiKey) {
    // En dev sin proveedor, registrar en consola en vez de fallar.
    console.warn("[mail] RESEND_API_KEY no configurada. Correo simulado:", { to, subject });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}

// --- Plantillas de notificación del flujo de revisión ---

export function mailAprobacion(args: { contratista: string; numeroContrato: string; cuota: number }) {
  return {
    subject: `Cuenta de cobro aprobada — ${args.numeroContrato} (cuota ${args.cuota})`,
    html: `<p>Estimado/a ${args.contratista},</p><p>Su cuenta de cobro de la cuota ${args.cuota} del contrato <b>${args.numeroContrato}</b> ha sido <b>aprobada</b>.</p>`,
  };
}

export function mailRechazo(args: {
  contratista: string;
  numeroContrato: string;
  cuota: number;
  observaciones: string;
}) {
  return {
    subject: `Correcciones requeridas — ${args.numeroContrato} (cuota ${args.cuota})`,
    html: `<p>Estimado/a ${args.contratista},</p><p>Su cuenta de cobro de la cuota ${args.cuota} del contrato <b>${args.numeroContrato}</b> requiere correcciones:</p><blockquote>${args.observaciones}</blockquote><p>Por favor ajuste y reenvíe a revisión.</p>`,
  };
}
