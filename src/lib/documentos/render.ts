// Render de documentos a partir de plantillas (ver src/lib/plantillas/defaults.ts).
// Reemplaza marcadores {{campo}} con los datos del período. La conversión a PDF
// se hace con @react-pdf/renderer a partir de la estructura resultante
// (ver docs/03-rfc-arquitectura.md §6) — pendiente de implementar el binario.

export interface PlantillaContenido {
  titulo: string;
  secciones: { titulo: string; cuerpo: string }[];
  campos: string[];
}

export interface DocumentoRenderizado {
  titulo: string;
  secciones: { titulo: string; cuerpo: string }[];
  faltantes: string[]; // marcadores sin valor (para alertar)
}

const MARCADOR = /\{\{(\w+)\}\}/g;

function reemplazar(texto: string, datos: Record<string, unknown>, faltantes: Set<string>): string {
  return texto.replace(MARCADOR, (_, campo: string) => {
    const v = datos[campo];
    if (v === undefined || v === null || v === "") {
      faltantes.add(campo);
      return `{{${campo}}}`;
    }
    return String(v);
  });
}

/** Rellena una plantilla con los datos del período. */
export function renderPlantilla(
  contenido: PlantillaContenido,
  datos: Record<string, unknown>,
): DocumentoRenderizado {
  const faltantes = new Set<string>();
  return {
    titulo: reemplazar(contenido.titulo, datos, faltantes),
    secciones: contenido.secciones.map((s) => ({
      titulo: s.titulo,
      cuerpo: reemplazar(s.cuerpo, datos, faltantes),
    })),
    faltantes: [...faltantes],
  };
}
