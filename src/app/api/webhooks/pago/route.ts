import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { renovarSuscripcion } from "@/lib/tenants/billing";

// Webhook de confirmación de pago. Lo invoca la pasarela/banco (o un proceso de
// conciliación) cuando un pago se refleja → renueva el periodo y REACTIVA la
// entidad automáticamente. Protegido con secreto compartido.
//
//   POST /api/webhooks/pago
//   Header: x-webhook-secret: <PAGOS_WEBHOOK_SECRET>
//   Body JSON: { "tenantId": "..." }  ó  { "slug": "alcaldia-demo" }

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.PAGOS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }
  if (req.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { tenantId?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.tenantId && !body.slug) {
    return NextResponse.json({ error: "Falta tenantId o slug" }, { status: 400 });
  }

  let tenantId = body.tenantId;
  if (!tenantId && body.slug) {
    const t = await prisma.tenant.findUnique({ where: { slug: body.slug }, select: { id: true } });
    tenantId = t?.id;
  }
  if (!tenantId) {
    return NextResponse.json({ error: "Entidad no encontrada" }, { status: 404 });
  }

  const res = await renovarSuscripcion(tenantId);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    tenantId: res.tenantId,
    fechaVencimiento: res.fechaVencimiento.toISOString(),
  });
}
