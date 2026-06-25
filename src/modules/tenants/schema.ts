import { z } from "zod";

// Validación para la gestión de entidades (tenants) por parte del SUPERADMIN.
// La habilitación depende de la vigencia del contrato (no de pagos).

export const crearTenantInput = z.object({
  nombre: z.string().min(3, "El nombre es muy corto").max(120),
  slug: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones (sin espacios)"),
  nit: z.string().max(20).optional(),
  fechaInicioContrato: z.string().optional(),
  fechaFinContrato: z.string().min(1, "La fecha de fin del contrato es obligatoria"),
  adminNombre: z.string().min(3, "El nombre del administrador es muy corto").max(120),
  adminEmail: z.string().email("Correo inválido"),
  adminPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type CrearTenantInput = z.infer<typeof crearTenantInput>;

export const actualizarContratoInput = z.object({
  id: z.string().min(1),
  fechaInicioContrato: z.string().nullable(),
  fechaFinContrato: z.string().min(1, "La fecha de fin del contrato es obligatoria"),
});

export type ActualizarContratoInput = z.infer<typeof actualizarContratoInput>;
