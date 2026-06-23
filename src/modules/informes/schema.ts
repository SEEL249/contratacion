import { z } from "zod";

// Validación del módulo de informes de actividades.

export const evidenciaInput = z.object({
  // La evidencia ya fue subida al storage; aquí se registran sus metadatos.
  tipo: z.enum(["IMAGEN", "PDF", "DOC", "TXT", "VIDEO"]),
  blobUrl: z.string().url(),
  nombre: z.string().min(1),
  mimeType: z.string().min(1),
  tamanoBytes: z.number().int().positive(),
  hash: z.string().optional(),
});

export const registrarObligacionInput = z.object({
  cuentaCobroId: z.string().min(1),
  obligacionContratoId: z.string().min(1),
  descripcionContratista: z.string().min(5, "Describa la actividad ejecutada"),
  // Evidencia OBLIGATORIA por cada actividad reportada.
  evidencias: z.array(evidenciaInput).min(1, "Adjunte al menos una evidencia"),
  // Si true, se llama a Grok para ampliar/corregir la descripción.
  ampliarConIa: z.boolean().default(true),
});

export type RegistrarObligacionInput = z.infer<typeof registrarObligacionInput>;
