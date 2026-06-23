import { z } from "zod";

// Validación de entrada del módulo de contratos (límite del sistema).
// Ver docs/03-rfc-arquitectura.md §9 y prisma/schema.prisma.

export const obligacionInput = z.object({
  texto: z.string().min(5, "La obligación es demasiado corta"),
  orden: z.number().int().nonnegative().default(0),
});

export const crearContratoInput = z
  .object({
    objeto: z.string().min(10, "El objeto debe describir el contrato"),
    vigenciaInicio: z.coerce.date(),
    vigenciaFin: z.coerce.date(),
    valorTotal: z.coerce.number().positive(),
    valorCuota: z.coerce.number().positive(),
    numeroCuotas: z.coerce.number().int().positive(),
    tipoVinculacion: z.enum(["PROFESIONAL", "APOYO_GESTION"]),
    nivelRiesgoArl: z.coerce.number().int().min(1).max(5).optional(),
    obligaciones: z.array(obligacionInput).min(1, "Defina al menos una obligación"),
  })
  .refine((d) => d.vigenciaFin > d.vigenciaInicio, {
    message: "La vigencia final debe ser posterior a la inicial",
    path: ["vigenciaFin"],
  })
  // Coherencia valor: valorCuota * numeroCuotas ≈ valorTotal (tolerancia 1 peso)
  .refine((d) => Math.abs(d.valorCuota * d.numeroCuotas - d.valorTotal) < 1, {
    message: "valorCuota × numeroCuotas debe igualar el valorTotal",
    path: ["valorCuota"],
  });

export type CrearContratoInput = z.infer<typeof crearContratoInput>;

export const asignacionInput = z.object({
  contratistaId: z.string().min(1),
  numeroContrato: z.string().min(1, "El número de contrato es obligatorio"),
  supervisorId: z.string().min(1).optional(),
});

export const asignarContratistasInput = z.object({
  contratoId: z.string().min(1),
  asignaciones: z.array(asignacionInput).min(1, "Asigne al menos un contratista"),
});

export type AsignarContratistasInput = z.infer<typeof asignarContratistasInput>;
