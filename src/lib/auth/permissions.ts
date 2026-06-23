import type { Role } from "@prisma/client";

// Matriz de permisos centralizada (RBAC). Ver docs/03-rfc-arquitectura.md §3.
// La verificación de "recurso ∈ tenant" y reglas de negocio (p. ej. supervisor
// solo ve el mes actual) se hace adicionalmente en cada Server Action.

export type Permission =
  | "tenant:manage" // crear/gestionar tenants (superadmin)
  | "tenant:configure" // plantillas, usuarios, parámetros del tenant
  | "contrato:create"
  | "contrato:read"
  | "contrato:assign"
  | "cuentaCobro:create"
  | "cuentaCobro:read"
  | "informe:create"
  | "informe:read"
  | "supervision:read"
  | "revision:approve"
  | "revision:reject";

const PERMISSIONS_BY_ROLE: Record<Role, Permission[]> = {
  SUPERADMIN: ["tenant:manage"],
  ADMIN_TENANT: ["tenant:configure", "contrato:read", "cuentaCobro:read", "informe:read"],
  PERSONA_CONTRATACION: [
    "contrato:create",
    "contrato:read",
    "contrato:assign",
    "cuentaCobro:read",
    "informe:read",
    "revision:approve",
    "revision:reject",
  ],
  SUPERVISOR: ["supervision:read"],
  CONTRATISTA: [
    "contrato:read",
    "cuentaCobro:create",
    "cuentaCobro:read",
    "informe:create",
    "informe:read",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return PERMISSIONS_BY_ROLE[role]?.includes(permission) ?? false;
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(`Acceso denegado: el rol ${role} no tiene el permiso ${permission}`);
  }
}
