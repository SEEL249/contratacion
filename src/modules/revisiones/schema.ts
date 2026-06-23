import { z } from "zod";

// Validación del flujo de revisión. Observaciones obligatorias al rechazar.

export const revisarInput = z
  .object({
    cuentaCobroId: z.string().min(1),
    accion: z.enum(["APROBAR", "RECHAZAR"]),
    observaciones: z.string().optional(),
  })
  .refine((d) => d.accion !== "RECHAZAR" || (d.observaciones && d.observaciones.trim().length >= 5), {
    message: "Las observaciones son obligatorias al rechazar",
    path: ["observaciones"],
  });

export type RevisarInput = z.infer<typeof revisarInput>;
