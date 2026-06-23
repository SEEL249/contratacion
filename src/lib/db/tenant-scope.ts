import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { esModeloScoped, aplicarScopeTenant } from "./tenant-scope-core";

export { esModeloScoped, aplicarScopeTenant } from "./tenant-scope-core";

// Wrapper de acceso a datos tenant-scoped. Ver docs/03-rfc-arquitectura.md §2.
//
// Garantiza el aislamiento multi-tenant inyectando `tenantId` automáticamente:
//  - en lecturas (find*/count/aggregate): añade `where: { tenantId }`
//  - en escrituras (create/createMany): añade `data: { tenantId }`
//  - en update/delete masivos: restringe `where: { tenantId }`
//
// La capa de dominio SIEMPRE debe usar `forTenant(tenantId)` y NUNCA el cliente
// `prisma` crudo (salvo flujos de SUPERADMIN, que operan fuera de un tenant).
//
// ⚠️ LIMITACIÓN: la inyección solo aplica a la operación de nivel superior. En
// creates ANIDADOS de un modelo scoped (p. ej. `cuentaCobro.create({ data: {
// informe: { create: {...} } } })`), hay que pasar `tenantId` explícito en el
// payload anidado.

/**
 * Devuelve un cliente Prisma extendido y atado a un tenant concreto.
 * Cachear por request es recomendable (no por proceso).
 */
export function forTenant(tenantId: string) {
  if (!tenantId) throw new Error("forTenant requiere un tenantId válido");

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!esModeloScoped(model)) return query(args);
          const a = aplicarScopeTenant(model, operation, args as Record<string, unknown>, tenantId);
          return query(a as typeof args);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof forTenant>;

// Cliente sin scope para flujos de SUPERADMIN. Usar con extrema cautela.
export { prisma as superadminDb };
export { Prisma };
