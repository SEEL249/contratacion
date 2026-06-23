import { z } from "zod";

// Validación de documentos anexos. Ver docs/00...§5.7.

export const registrarAnexoInput = z.object({
  cuentaCobroId: z.string().min(1),
  tipo: z.enum(["SEGURIDAD_SOCIAL", "PARAFISCALES", "OTRO"]),
  blobUrl: z.string().url(),
  nombre: z.string().min(1),
  mimeType: z.string().min(1),
  tamanoBytes: z.number().int().positive(),
});

export type RegistrarAnexoInput = z.infer<typeof registrarAnexoInput>;
