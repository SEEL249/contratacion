import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { uploadFile, validarArchivo } from "@/lib/storage/storage";

// Subida de evidencias/documentos/firmas. Multipart form-data.
// Campos: file, contratoId, cuentaId, carpeta (evidencias|documentos|firmas).
export async function POST(req: Request) {
  let ctx;
  try {
    ({ ctx } = await requireTenant("cuentaCobro:create"));
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const contratoId = String(form.get("contratoId") ?? "");
  const cuentaId = String(form.get("cuentaId") ?? "");
  const carpeta = String(form.get("carpeta") ?? "evidencias") as
    | "evidencias"
    | "documentos"
    | "firmas";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }
  try {
    validarArchivo(file.type, file.size);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const { url } = await uploadFile({
    tenantId: ctx.tenantId!,
    contratoId,
    cuentaId,
    carpeta,
    filename: file.name,
    data: file,
    contentType: file.type,
  });

  return NextResponse.json({
    url,
    nombre: file.name,
    mimeType: file.type,
    tamanoBytes: file.size,
  });
}
