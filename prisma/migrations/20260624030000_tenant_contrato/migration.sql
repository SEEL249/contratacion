-- Vigencia del contrato de la entidad (habilitación por duración de contrato).
ALTER TABLE "Tenant" ADD COLUMN "fechaInicioContrato" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "fechaFinContrato" TIMESTAMP(3);

-- Migrar el antiguo "fechaVencimiento" (esquema de pago) a fin de contrato.
UPDATE "Tenant"
SET "fechaFinContrato" = "fechaVencimiento"
WHERE "fechaFinContrato" IS NULL;
