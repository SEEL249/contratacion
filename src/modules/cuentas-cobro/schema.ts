import { z } from "zod";

// Validación del módulo de cuentas de cobro. Ver prisma/schema.prisma y
// docs/01-reglas-negocio-co.md (seguridad social / PILA).

export const crearCuentaCobroInput = z.object({
  // Asignación (ContratoContratista) sobre la que se cobra. El contratista solo
  // puede usar asignaciones propias (se verifica en la acción).
  asignacionId: z.string().min(1),
  // Datos ingresados por el contratista
  plataformaSeguridadSocial: z.string().min(1, "Seleccione la plataforma de pago"),
  numeroPlanilla: z.string().min(1, "El número de planilla es obligatorio"),
  tipoPlanilla: z.enum(["I", "Y"]).optional(),
  tipoVinculacion: z.enum(["PROFESIONAL", "APOYO_GESTION"]),
});

export type CrearCuentaCobroInput = z.infer<typeof crearCuentaCobroInput>;

export const guardarFirmaInput = z.object({
  cuentaCobroId: z.string().min(1),
  blobUrl: z.string().url(),
  origen: z.enum(["SUBIDA", "DIBUJADA"]),
});

export type GuardarFirmaInput = z.infer<typeof guardarFirmaInput>;
