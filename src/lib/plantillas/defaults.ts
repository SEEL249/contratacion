import type { TipoPlantilla } from "@prisma/client";

// Plantillas por defecto para tenants nuevos. Cada entidad puede clonarlas y
// personalizarlas. El `contenido` usa marcadores {{campo}} que se reemplazan al
// generar el documento. Ver docs/03-rfc-arquitectura.md §6.

export interface PlantillaDefault {
  tipo: TipoPlantilla;
  nombre: string;
  contenido: {
    titulo: string;
    secciones: { titulo: string; cuerpo: string }[];
    campos: string[]; // marcadores variables que deben inyectarse
  };
}

export const PLANTILLAS_DEFAULT: PlantillaDefault[] = [
  {
    tipo: "CONTRATO",
    nombre: "Contrato de prestación de servicios (base)",
    contenido: {
      titulo: "CONTRATO DE PRESTACIÓN DE SERVICIOS N.º {{numeroContrato}}",
      secciones: [
        {
          titulo: "PARTES",
          cuerpo:
            "Entre {{nombreEntidad}}, NIT {{nitEntidad}}, y {{nombreContratista}}, identificado con cédula {{cedulaContratista}}, se celebra el presente contrato.",
        },
        { titulo: "OBJETO", cuerpo: "{{objeto}}" },
        {
          titulo: "VALOR Y FORMA DE PAGO",
          cuerpo:
            "Valor total: {{valorTotal}}. Pagadero en {{numeroCuotas}} cuotas de {{valorCuota}} cada una, previa presentación de informe de actividades y cuenta de cobro.",
        },
        { titulo: "PLAZO", cuerpo: "Del {{vigenciaInicio}} al {{vigenciaFin}}." },
        { titulo: "OBLIGACIONES", cuerpo: "{{obligaciones}}" },
      ],
      campos: [
        "numeroContrato",
        "nombreEntidad",
        "nitEntidad",
        "nombreContratista",
        "cedulaContratista",
        "objeto",
        "valorTotal",
        "numeroCuotas",
        "valorCuota",
        "vigenciaInicio",
        "vigenciaFin",
        "obligaciones",
      ],
    },
  },
  {
    tipo: "ACTA_INICIAL",
    nombre: "Acta de inicio",
    contenido: {
      titulo: "ACTA DE INICIO — CONTRATO N.º {{numeroContrato}}",
      secciones: [
        {
          titulo: "INICIO DE EJECUCIÓN",
          cuerpo:
            "En {{fecha}} se da inicio a la ejecución del contrato suscrito con {{nombreContratista}}, objeto: {{objeto}}.",
        },
        {
          titulo: "VALORES",
          cuerpo:
            "Valor del primer pago: {{valorPrimerPago}}. Valor pendiente de las cuotas siguientes: {{valorPendiente}}.",
        },
      ],
      campos: [
        "numeroContrato",
        "fecha",
        "nombreContratista",
        "objeto",
        "valorPrimerPago",
        "valorPendiente",
      ],
    },
  },
  {
    tipo: "ACTA_PARCIAL",
    nombre: "Acta parcial (mensual)",
    contenido: {
      titulo: "ACTA PARCIAL N.º {{numeroCuota}} — CONTRATO N.º {{numeroContrato}}",
      secciones: [
        {
          titulo: "PERÍODO",
          cuerpo:
            "Acta correspondiente a la cuota {{numeroCuota}}, período {{periodo}}, del contratista {{nombreContratista}}.",
        },
        {
          titulo: "PAGO Y SALDO",
          cuerpo: "Pago del período: {{valorPago}}. Saldo pendiente por pagar: {{saldoPendiente}}.",
        },
      ],
      campos: [
        "numeroContrato",
        "numeroCuota",
        "periodo",
        "nombreContratista",
        "valorPago",
        "saldoPendiente",
      ],
    },
  },
  {
    tipo: "ACTA_FINAL",
    nombre: "Acta de liquidación / final",
    contenido: {
      titulo: "ACTA FINAL — CONTRATO N.º {{numeroContrato}}",
      secciones: [
        {
          titulo: "TERMINACIÓN",
          cuerpo:
            "Se deja constancia de la terminación del contrato con {{nombreContratista}}, objeto: {{objeto}}.",
        },
        {
          titulo: "RELACIÓN DE PAGOS",
          cuerpo: "Se relacionan todos los pagos efectuados durante la ejecución: {{relacionPagos}}.",
        },
        { titulo: "TOTAL EJECUTADO", cuerpo: "Total pagado: {{totalPagado}}." },
      ],
      campos: ["numeroContrato", "nombreContratista", "objeto", "relacionPagos", "totalPagado"],
    },
  },
  {
    tipo: "CUENTA_COBRO",
    nombre: "Cuenta de cobro",
    contenido: {
      titulo: "CUENTA DE COBRO N.º {{numeroCuota}}",
      secciones: [
        {
          titulo: "DATOS DEL CONTRATISTA",
          cuerpo:
            "{{nombreContratista}}, C.C. {{cedulaContratista}}, contrato N.º {{numeroContrato}} ({{tipoVinculacion}}).",
        },
        {
          titulo: "CONCEPTO",
          cuerpo:
            "Cobro de la cuota {{numeroCuota}} de {{numeroCuotas}} por valor de {{valorCuota}}, en cumplimiento del objeto contractual.",
        },
        {
          titulo: "SEGURIDAD SOCIAL",
          cuerpo:
            "Plataforma: {{plataformaSeguridadSocial}}. Planilla N.º {{numeroPlanilla}}.",
        },
      ],
      campos: [
        "numeroCuota",
        "numeroCuotas",
        "nombreContratista",
        "cedulaContratista",
        "numeroContrato",
        "tipoVinculacion",
        "valorCuota",
        "plataformaSeguridadSocial",
        "numeroPlanilla",
      ],
    },
  },
  {
    tipo: "PARAFISCALES",
    nombre: "Declaración de parafiscales / aportes",
    contenido: {
      titulo: "CERTIFICACIÓN DE APORTES — CONTRATO N.º {{numeroContrato}}",
      secciones: [
        {
          titulo: "DECLARACIÓN",
          cuerpo:
            "{{nombreContratista}}, C.C. {{cedulaContratista}}, certifica el pago de sus aportes al sistema de seguridad social correspondientes al período {{periodo}}, planilla N.º {{numeroPlanilla}}.",
        },
      ],
      campos: ["numeroContrato", "nombreContratista", "cedulaContratista", "periodo", "numeroPlanilla"],
    },
  },
];
