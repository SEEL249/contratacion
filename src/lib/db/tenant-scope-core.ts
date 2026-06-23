// Lógica pura del aislamiento multi-tenant (SIN dependencias de Prisma/BD), para
// poder testearla en aislamiento. La usa el wrapper real en ./tenant-scope.ts.

// Modelos que llevan `tenantId` directo y deben filtrarse automáticamente.
export const TENANT_SCOPED_MODELS = new Set<string>([
  "User",
  "Plantilla",
  "Contrato",
  "CuentaCobro",
  "InformeActividades",
  "Acta",
  "Revision",
]);

export const READ_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

export const WRITE_WHERE_OPS = new Set(["updateMany", "deleteMany"]);

/** ¿El modelo se filtra automáticamente por tenant? */
export function esModeloScoped(model: string | undefined): boolean {
  return !!model && TENANT_SCOPED_MODELS.has(model);
}

/**
 * Lógica pura de inyección de `tenantId` en los args de una operación Prisma.
 * Devuelve los args modificados (no muta el original).
 */
export function aplicarScopeTenant(
  model: string | undefined,
  operation: string,
  args: Record<string, unknown> | undefined,
  tenantId: string,
): Record<string, unknown> {
  const a = { ...(args ?? {}) } as Record<string, unknown>;
  if (!esModeloScoped(model)) return a;

  if (READ_OPS.has(operation) || WRITE_WHERE_OPS.has(operation)) {
    a.where = { ...(a.where as object), tenantId };
  } else if (operation === "create") {
    a.data = { ...(a.data as object), tenantId };
  } else if (operation === "createMany") {
    const data = a.data;
    a.data = Array.isArray(data)
      ? data.map((d) => ({ ...(d as object), tenantId }))
      : { ...(data as object), tenantId };
  } else if (operation === "update" || operation === "delete" || operation === "upsert") {
    // Operaciones por id: restringimos vía where (Prisma 6, extendedWhereUnique).
    a.where = { ...(a.where as object), tenantId };
    if (operation === "upsert") {
      a.create = { ...(a.create as object), tenantId };
    }
  }
  return a;
}
