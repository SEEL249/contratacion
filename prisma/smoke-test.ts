import EmbeddedPostgres from "embedded-postgres";
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

// Prueba de humo de PERSISTENCIA: levanta un PostgreSQL local embebido, aplica las
// migraciones, inserta datos y los vuelve a leer para confirmar que se guardan.
// No usa Neon ni credenciales reales. Ejecutar: npx tsx prisma/smoke-test.ts

async function main() {
  const dataDir = path.join(process.cwd(), ".pgdata-smoke");
  rmSync(dataDir, { recursive: true, force: true });

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "postgres",
    port: 55432,
    persistent: false,
  });

  console.log("→ Iniciando PostgreSQL embebido…");
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("contratacion_test");

  const url = "postgresql://postgres:postgres@localhost:55432/contratacion_test";

  console.log("→ Aplicando migraciones (prisma migrate deploy)…");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });

  const prisma = new PrismaClient({ datasourceUrl: url });

  console.log("→ Insertando datos…");
  const tenant = await prisma.tenant.create({ data: { nombre: "Smoke", slug: "smoke" } });
  const user = await prisma.user.create({
    data: { tenantId: tenant.id, email: "ana@smoke.co", nombre: "Ana", role: "CONTRATISTA" },
  });
  const contrato = await prisma.contrato.create({
    data: {
      tenantId: tenant.id,
      creadorId: user.id,
      objeto: "Contrato de prueba de persistencia",
      vigenciaInicio: new Date("2026-07-01"),
      vigenciaFin: new Date("2026-12-31"),
      valorTotal: "12000000",
      valorCuota: "1000000",
      numeroCuotas: 12,
      tipoVinculacion: "PROFESIONAL",
      obligaciones: { create: [{ texto: "Obligación de prueba", orden: 1 }] },
    },
    include: { obligaciones: true },
  });

  console.log("→ Leyendo de vuelta…");
  const tenants = await prisma.tenant.count();
  const found = await prisma.user.findFirst({ where: { email: "ana@smoke.co" } });
  const contratoLeido = await prisma.contrato.findUnique({
    where: { id: contrato.id },
    include: { obligaciones: true },
  });

  console.log("\n--- RESULTADOS ---");
  console.log("Tenants guardados:", tenants);
  console.log("Usuario leído:", found?.nombre, "| id coincide:", found?.id === user.id);
  console.log("Contrato leído:", contratoLeido?.objeto);
  console.log("Valor total (Decimal):", String(contratoLeido?.valorTotal));
  console.log("Obligaciones guardadas:", contratoLeido?.obligaciones.length);

  await prisma.$disconnect();
  await pg.stop();
  rmSync(dataDir, { recursive: true, force: true });

  const ok =
    tenants === 1 &&
    found?.id === user.id &&
    contratoLeido?.obligaciones.length === 1 &&
    String(contratoLeido?.valorTotal) === "12000000";

  if (ok) {
    console.log("\n✅ SMOKE TEST OK: los datos se GUARDAN y se LEEN correctamente.");
  } else {
    throw new Error("❌ Smoke test FALLÓ: los datos no coinciden.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
