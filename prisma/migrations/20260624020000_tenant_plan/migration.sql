-- Planes de suscripción por entidad y vencimiento calculado por plan.
CREATE TYPE "PlanSuscripcion" AS ENUM ('MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

ALTER TABLE "Tenant" ADD COLUMN "plan" "PlanSuscripcion" NOT NULL DEFAULT 'MENSUAL';

-- Backfill: entidades sin vencimiento → creación + 1 mes (plan mensual por defecto).
UPDATE "Tenant"
SET "fechaVencimiento" = "createdAt" + INTERVAL '1 month'
WHERE "fechaVencimiento" IS NULL;
