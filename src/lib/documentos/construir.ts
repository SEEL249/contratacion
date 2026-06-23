import { renderPlantilla, type DocumentoRenderizado, type PlantillaContenido } from "./render";

// Constructores de DocumentoRenderizado a partir de los datos del período.
// La cuenta de cobro usa la plantilla del tenant; el informe de actividades y la
// supervisión se arman directamente (son textos producidos en el flujo).

interface CuentaParaDoc {
  numeroCuota: number;
  numeroCuotasContrato: number;
  nombreContratista: string;
  cedulaContratista: string;
  tipoVinculacion: string;
  valorCuota: unknown;
  plataformaSeguridadSocial: string;
  numeroPlanilla: string;
  numeroContrato: string;
}

/** Cuenta de cobro: rellena la plantilla CUENTA_COBRO del tenant. */
export function construirCuentaCobro(
  plantilla: PlantillaContenido,
  cuenta: CuentaParaDoc,
): DocumentoRenderizado {
  return renderPlantilla(plantilla, {
    numeroCuota: cuenta.numeroCuota,
    numeroCuotas: cuenta.numeroCuotasContrato,
    nombreContratista: cuenta.nombreContratista,
    cedulaContratista: cuenta.cedulaContratista,
    numeroContrato: cuenta.numeroContrato,
    tipoVinculacion: cuenta.tipoVinculacion,
    valorCuota: String(cuenta.valorCuota),
    plataformaSeguridadSocial: cuenta.plataformaSeguridadSocial,
    numeroPlanilla: cuenta.numeroPlanilla,
  });
}

/** Informe de actividades: una sección por obligación ejecutada (texto ampliado). */
export function construirInformeActividades(args: {
  numeroContrato: string;
  numeroCuota: number;
  nombreContratista: string;
  obligaciones: { obligacionTexto: string; descripcion: string }[];
}): DocumentoRenderizado {
  return {
    titulo: `INFORME DE ACTIVIDADES — ${args.numeroContrato} (cuota ${args.numeroCuota})`,
    secciones: [
      { titulo: "CONTRATISTA", cuerpo: args.nombreContratista },
      ...args.obligaciones.map((o, i) => ({
        titulo: `OBLIGACIÓN ${i + 1}: ${o.obligacionTexto}`,
        cuerpo: o.descripcion,
      })),
    ],
    faltantes: [],
  };
}

/** Informe de supervisión: el texto en 3ª persona generado por IA. */
export function construirSupervision(args: {
  numeroContrato: string;
  numeroCuota: number;
  contenido: string;
}): DocumentoRenderizado {
  return {
    titulo: `INFORME DE SUPERVISIÓN — ${args.numeroContrato} (cuota ${args.numeroCuota})`,
    secciones: [{ titulo: "CONCEPTO DE SUPERVISIÓN", cuerpo: args.contenido }],
    faltantes: [],
  };
}
