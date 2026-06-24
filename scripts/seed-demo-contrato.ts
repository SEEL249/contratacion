import { prisma } from "../src/lib/db/prisma";

// Siembra un contrato de demostración (con obligaciones y asignación) en el
// tenant alcaldia-demo, para poder recorrer el flujo en la UI. Idempotente.

const OBJETO_DEMO =
  "Prestación de servicios profesionales de apoyo a la gestión administrativa y documental (CONTRATO DEMO)";
const NUMERO_DEMO = "CPS-2026-001";

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "alcaldia-demo" } });
  if (!tenant) throw new Error("No existe el tenant alcaldia-demo (corre el seed primero).");

  const [creador, contratista, supervisor] = await Promise.all([
    prisma.user.findFirst({ where: { tenantId: tenant.id, role: "PERSONA_CONTRATACION" } }),
    prisma.user.findFirst({ where: { tenantId: tenant.id, role: "CONTRATISTA" } }),
    prisma.user.findFirst({ where: { tenantId: tenant.id, role: "SUPERVISOR" } }),
  ]);
  if (!creador || !contratista || !supervisor) {
    throw new Error("Faltan usuarios por rol en el tenant demo.");
  }

  let contrato = await prisma.contrato.findFirst({
    where: { tenantId: tenant.id, objeto: OBJETO_DEMO },
  });

  if (contrato) {
    console.log("Contrato demo ya existe:", contrato.id);
  } else {
    contrato = await prisma.contrato.create({
      data: {
        tenantId: tenant.id,
        objeto: OBJETO_DEMO,
        vigenciaInicio: new Date("2026-01-15"),
        vigenciaFin: new Date("2026-06-30"),
        valorTotal: "18000000",
        valorCuota: "3000000",
        numeroCuotas: 6,
        tipoVinculacion: "PROFESIONAL",
        nivelRiesgoArl: 1,
        creadorId: creador.id,
        obligaciones: {
          create: [
            { texto: "Apoyar la organización y digitalización del archivo documental.", orden: 1 },
            { texto: "Elaborar informes mensuales de gestión administrativa.", orden: 2 },
            { texto: "Brindar soporte en la atención de requerimientos ciudadanos.", orden: 3 },
          ],
        },
      },
    });
    console.log("Contrato demo creado:", contrato.id);
  }

  const asignacion = await prisma.contratoContratista.upsert({
    where: { contratoId_numeroContrato: { contratoId: contrato.id, numeroContrato: NUMERO_DEMO } },
    update: {},
    create: {
      contratoId: contrato.id,
      contratistaId: contratista.id,
      supervisorId: supervisor.id,
      numeroContrato: NUMERO_DEMO,
    },
  });

  console.log("Asignación lista:", {
    numeroContrato: asignacion.numeroContrato,
    contratista: contratista.email,
    supervisor: supervisor.email,
  });
  console.log("\n✅ Listo. Entra como contratista y verás el contrato disponible para cuenta de cobro.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
