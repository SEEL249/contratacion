-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN_TENANT', 'PERSONA_CONTRATACION', 'SUPERVISOR', 'CONTRATISTA');

-- CreateEnum
CREATE TYPE "TipoVinculacion" AS ENUM ('PROFESIONAL', 'APOYO_GESTION');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('BORRADOR', 'EN_REVISION', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "TipoActa" AS ENUM ('INICIAL', 'PARCIAL', 'FINAL');

-- CreateEnum
CREATE TYPE "TipoPlantilla" AS ENUM ('CONTRATO', 'ACTA_INICIAL', 'ACTA_PARCIAL', 'ACTA_FINAL', 'CUENTA_COBRO', 'PARAFISCALES');

-- CreateEnum
CREATE TYPE "TipoDocumentoAnexo" AS ENUM ('SEGURIDAD_SOCIAL', 'PARAFISCALES', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoEvidencia" AS ENUM ('IMAGEN', 'PDF', 'DOC', 'TXT', 'VIDEO');

-- CreateEnum
CREATE TYPE "AccionRevision" AS ENUM ('APROBAR', 'RECHAZAR');

-- CreateEnum
CREATE TYPE "TipoPlanillaPila" AS ENUM ('I', 'Y');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "slug" TEXT NOT NULL,
    "config" JSONB,
    "logoUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plantilla" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoPlantilla" NOT NULL,
    "nombre" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "objeto" TEXT NOT NULL,
    "vigenciaInicio" TIMESTAMP(3) NOT NULL,
    "vigenciaFin" TIMESTAMP(3) NOT NULL,
    "valorTotal" DECIMAL(15,2) NOT NULL,
    "valorCuota" DECIMAL(15,2) NOT NULL,
    "numeroCuotas" INTEGER NOT NULL,
    "tipoVinculacion" "TipoVinculacion" NOT NULL,
    "nivelRiesgoArl" INTEGER,
    "creadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoContratista" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "contratistaId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "numeroContrato" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratoContratista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligacionContrato" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObligacionContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaCobro" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "asignacionId" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "plataformaSeguridadSocial" TEXT NOT NULL,
    "numeroPlanilla" TEXT NOT NULL,
    "tipoPlanilla" "TipoPlanillaPila",
    "tipoVinculacion" "TipoVinculacion" NOT NULL,
    "nombreContratista" TEXT NOT NULL,
    "cedulaContratista" TEXT NOT NULL,
    "valorTotalContrato" DECIMAL(15,2) NOT NULL,
    "valorCuota" DECIMAL(15,2) NOT NULL,
    "numeroCuotasContrato" INTEGER NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuentaCobro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Firma" (
    "id" TEXT NOT NULL,
    "cuentaCobroId" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Firma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformeActividades" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cuentaCobroId" TEXT NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InformeActividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligacionEjecutada" (
    "id" TEXT NOT NULL,
    "informeId" TEXT NOT NULL,
    "obligacionContratoId" TEXT NOT NULL,
    "descripcionContratista" TEXT NOT NULL,
    "descripcionAmpliada" TEXT,
    "promptVersion" TEXT,
    "modeloIa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObligacionEjecutada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidencia" (
    "id" TEXT NOT NULL,
    "obligacionEjecutadaId" TEXT NOT NULL,
    "tipo" "TipoEvidencia" NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformeSupervision" (
    "id" TEXT NOT NULL,
    "informeId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "promptVersion" TEXT,
    "modeloIa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InformeSupervision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "asignacionId" TEXT NOT NULL,
    "tipo" "TipoActa" NOT NULL,
    "cuentaCobroId" TEXT,
    "datos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Acta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoAnexo" (
    "id" TEXT NOT NULL,
    "cuentaCobroId" TEXT NOT NULL,
    "tipo" "TipoDocumentoAnexo" NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoAnexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cuentaCobroId" TEXT NOT NULL,
    "revisorId" TEXT NOT NULL,
    "accion" "AccionRevision" NOT NULL,
    "observaciones" TEXT,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Revision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_nit_key" ON "Tenant"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Plantilla_tenantId_tipo_activa_idx" ON "Plantilla"("tenantId", "tipo", "activa");

-- CreateIndex
CREATE INDEX "Contrato_tenantId_idx" ON "Contrato"("tenantId");

-- CreateIndex
CREATE INDEX "ContratoContratista_contratistaId_idx" ON "ContratoContratista"("contratistaId");

-- CreateIndex
CREATE INDEX "ContratoContratista_supervisorId_idx" ON "ContratoContratista"("supervisorId");

-- CreateIndex
CREATE UNIQUE INDEX "ContratoContratista_contratoId_numeroContrato_key" ON "ContratoContratista"("contratoId", "numeroContrato");

-- CreateIndex
CREATE INDEX "ObligacionContrato_contratoId_idx" ON "ObligacionContrato"("contratoId");

-- CreateIndex
CREATE INDEX "CuentaCobro_tenantId_estado_idx" ON "CuentaCobro"("tenantId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "CuentaCobro_asignacionId_numeroCuota_key" ON "CuentaCobro"("asignacionId", "numeroCuota");

-- CreateIndex
CREATE UNIQUE INDEX "Firma_cuentaCobroId_key" ON "Firma"("cuentaCobroId");

-- CreateIndex
CREATE UNIQUE INDEX "InformeActividades_cuentaCobroId_key" ON "InformeActividades"("cuentaCobroId");

-- CreateIndex
CREATE INDEX "InformeActividades_tenantId_idx" ON "InformeActividades"("tenantId");

-- CreateIndex
CREATE INDEX "ObligacionEjecutada_informeId_idx" ON "ObligacionEjecutada"("informeId");

-- CreateIndex
CREATE INDEX "Evidencia_obligacionEjecutadaId_idx" ON "Evidencia"("obligacionEjecutadaId");

-- CreateIndex
CREATE UNIQUE INDEX "InformeSupervision_informeId_key" ON "InformeSupervision"("informeId");

-- CreateIndex
CREATE UNIQUE INDEX "Acta_cuentaCobroId_key" ON "Acta"("cuentaCobroId");

-- CreateIndex
CREATE INDEX "Acta_tenantId_tipo_idx" ON "Acta"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "Acta_asignacionId_idx" ON "Acta"("asignacionId");

-- CreateIndex
CREATE INDEX "DocumentoAnexo_cuentaCobroId_tipo_idx" ON "DocumentoAnexo"("cuentaCobroId", "tipo");

-- CreateIndex
CREATE INDEX "Revision_tenantId_idx" ON "Revision"("tenantId");

-- CreateIndex
CREATE INDEX "Revision_cuentaCobroId_idx" ON "Revision"("cuentaCobroId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plantilla" ADD CONSTRAINT "Plantilla_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoContratista" ADD CONSTRAINT "ContratoContratista_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoContratista" ADD CONSTRAINT "ContratoContratista_contratistaId_fkey" FOREIGN KEY ("contratistaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoContratista" ADD CONSTRAINT "ContratoContratista_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligacionContrato" ADD CONSTRAINT "ObligacionContrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaCobro" ADD CONSTRAINT "CuentaCobro_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaCobro" ADD CONSTRAINT "CuentaCobro_asignacionId_fkey" FOREIGN KEY ("asignacionId") REFERENCES "ContratoContratista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Firma" ADD CONSTRAINT "Firma_cuentaCobroId_fkey" FOREIGN KEY ("cuentaCobroId") REFERENCES "CuentaCobro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformeActividades" ADD CONSTRAINT "InformeActividades_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformeActividades" ADD CONSTRAINT "InformeActividades_cuentaCobroId_fkey" FOREIGN KEY ("cuentaCobroId") REFERENCES "CuentaCobro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligacionEjecutada" ADD CONSTRAINT "ObligacionEjecutada_informeId_fkey" FOREIGN KEY ("informeId") REFERENCES "InformeActividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligacionEjecutada" ADD CONSTRAINT "ObligacionEjecutada_obligacionContratoId_fkey" FOREIGN KEY ("obligacionContratoId") REFERENCES "ObligacionContrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_obligacionEjecutadaId_fkey" FOREIGN KEY ("obligacionEjecutadaId") REFERENCES "ObligacionEjecutada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformeSupervision" ADD CONSTRAINT "InformeSupervision_informeId_fkey" FOREIGN KEY ("informeId") REFERENCES "InformeActividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acta" ADD CONSTRAINT "Acta_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acta" ADD CONSTRAINT "Acta_asignacionId_fkey" FOREIGN KEY ("asignacionId") REFERENCES "ContratoContratista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acta" ADD CONSTRAINT "Acta_cuentaCobroId_fkey" FOREIGN KEY ("cuentaCobroId") REFERENCES "CuentaCobro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoAnexo" ADD CONSTRAINT "DocumentoAnexo_cuentaCobroId_fkey" FOREIGN KEY ("cuentaCobroId") REFERENCES "CuentaCobro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_cuentaCobroId_fkey" FOREIGN KEY ("cuentaCobroId") REFERENCES "CuentaCobro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

