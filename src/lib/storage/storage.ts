import { put } from "@vercel/blob";

// Almacenamiento de archivos en Vercel Blob (ver docs/03-rfc-arquitectura.md §4).
// Ruta lógica por tenant para aislamiento y trazabilidad.
//
// NOTA: requiere `npm i @vercel/blob`. Acceso vía URLs; no exponer blobs públicos
// sin control. Validar MIME y tamaño antes de subir (config por tenant).

interface UploadArgs {
  tenantId: string;
  contratoId: string;
  cuentaId: string;
  carpeta: "evidencias" | "documentos" | "firmas";
  filename: string;
  data: Buffer | Blob | ArrayBuffer;
  contentType?: string;
}

export async function uploadFile(args: UploadArgs): Promise<{ url: string; pathname: string }> {
  const pathname = `tenants/${args.tenantId}/contratos/${args.contratoId}/cuentas/${args.cuentaId}/${args.carpeta}/${Date.now()}-${args.filename}`;
  const blob = await put(pathname, args.data as Blob, {
    access: "public",
    contentType: args.contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { url: blob.url, pathname };
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB (override por tenant)

export const MIME_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "video/mp4",
]);

export function validarArchivo(mime: string, bytes: number): void {
  if (!MIME_PERMITIDOS.has(mime)) throw new Error(`Tipo de archivo no permitido: ${mime}`);
  if (bytes > MAX_FILE_BYTES) throw new Error("El archivo excede el tamaño máximo permitido");
}
