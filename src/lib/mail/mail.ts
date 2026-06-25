// Servicio de correo por SMTP (correo personal, p. ej. Gmail). Runtime Node.
// Config por variables de entorno (se cargarán más adelante):
//   SMTP_HOST       p. ej. smtp.gmail.com
//   SMTP_PORT       587 (TLS) | 465 (SSL)            (def. 587)
//   SMTP_SECURE     "true" para 465                  (def. false)
//   SMTP_USER       el correo personal (remitente y login)
//   SMTP_PASSWORD   contraseña de aplicación (Gmail: App Password)
//   MAIL_FROM       remitente visible                (def. SMTP_USER)
// Si no está configurado, NO falla: registra el correo en consola (simulado).

import nodemailer from "nodemailer";

interface SendMailArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailArgs): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM ?? user ?? "no-reply@oss.example.co";

  if (!host || !user || !pass) {
    // Aún sin credenciales SMTP: simular para no romper el flujo.
    console.warn("[mail] SMTP no configurado. Correo simulado:", { to, subject });
    return;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({ from, to, subject, html });
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
