import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { generarPdf } from "@/lib/pdf/documento-pdf";
import {
  construirCuentaCobro,
  construirInformeActividades,
  construirSupervision,
} from "@/lib/documentos/construir";
import type { DocumentoRenderizado, PlantillaContenido } from "@/lib/documentos/render";

// Descarga de documentos en PDF.
//   /api/documentos?tipo=cuenta-cobro|informe|supervision&cuentaId=...
//   /api/documentos?tipo=acta&actaId=...
// Aislamiento por tenant (cliente scoped) + control por rol.

// @react-pdf/renderer requiere runtime Node.js (no Edge).
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const cuentaId = searchParams.get("cuentaId");
  const actaId = searchParams.get("actaId");

  let ctx, db;
  try {
    ({ ctx, db } = await requireTenant());
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenant = await db.tenant.findUnique({ where: { id: ctx.tenantId! } });
  const entidad = tenant?.nombre ?? "Entidad";

  let doc: DocumentoRenderizado | null = null;
  let nombreArchivo = "documento";

  if (tipo === "acta" && actaId) {
    const acta = await db.acta.findUnique({ where: { id: actaId } });
    if (!acta) return NextResponse.json({ error: "Acta no encontrada" }, { status: 404 });
    const datos = acta.datos as { render?: DocumentoRenderizado };
    doc = datos.render ?? null;
    nombreArchivo = `acta-${acta.tipo.toLowerCase()}`;
  } else if (cuentaId) {
    const cuenta = await db.cuentaCobro.findUnique({
      where: { id: cuentaId },
      include: {
        asignacion: { include: { contrato: { include: { obligaciones: true } } } },
        informe: {
          include: {
            obligacionesEjecutadas: { include: { obligacionContrato: true } },
            supervision: true,
          },
        },
      },
    });
    if (!cuenta) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });

    // Control por rol: contratista solo propias; supervisor solo supervisión propia.
    const esDueno = cuenta.asignacion.contratistaId === ctx.userId;
    const esSupervisor = cuenta.asignacion.supervisorId === ctx.userId;
    if (ctx.role === "CONTRATISTA" && !esDueno) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (ctx.role === "SUPERVISOR" && !(esSupervisor && tipo === "supervision")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const numeroContrato = cuenta.asignacion.numeroContrato;

    if (tipo === "cuenta-cobro") {
      const plantilla = await db.plantilla.findFirst({
        where: { tipo: "CUENTA_COBRO", activa: true },
        orderBy: { version: "desc" },
      });
      if (!plantilla) return NextResponse.json({ error: "Falta plantilla" }, { status: 412 });
      doc = construirCuentaCobro(plantilla.contenido as unknown as PlantillaContenido, {
        ...cuenta,
        numeroContrato,
      });
      nombreArchivo = `cuenta-cobro-${numeroContrato}-cuota${cuenta.numeroCuota}`;
    } else if (tipo === "informe") {
      doc = construirInformeActividades({
        numeroContrato,
        numeroCuota: cuenta.numeroCuota,
        nombreContratista: cuenta.nombreContratista,
        obligaciones:
          cuenta.informe?.obligacionesEjecutadas.map((o) => ({
            obligacionTexto: o.obligacionContrato.texto,
            descripcion: o.descripcionAmpliada ?? o.descripcionContratista,
          })) ?? [],
      });
      nombreArchivo = `informe-${numeroContrato}-cuota${cuenta.numeroCuota}`;
    } else if (tipo === "supervision") {
      if (!cuenta.informe?.supervision) {
        return NextResponse.json({ error: "Sin informe de supervisión" }, { status: 404 });
      }
      doc = construirSupervision({
        numeroContrato,
        numeroCuota: cuenta.numeroCuota,
        contenido: cuenta.informe.supervision.contenido,
      });
      nombreArchivo = `supervision-${numeroContrato}-cuota${cuenta.numeroCuota}`;
    }
  }

  if (!doc) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });

  const pdf = await generarPdf({ doc, entidad });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombreArchivo}.pdf"`,
    },
  });
}
