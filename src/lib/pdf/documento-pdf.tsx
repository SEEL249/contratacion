import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { DocumentoRenderizado } from "@/lib/documentos/render";

// Render a PDF de un documento ya rellenado (titulo + secciones). Reutilizable
// para cuenta de cobro, informe, supervisión y actas. Ver docs/03...§6.
// Requiere: npm i @react-pdf/renderer

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, lineHeight: 1.5, fontFamily: "Helvetica" },
  header: { marginBottom: 16, borderBottom: "1px solid #999", paddingBottom: 8 },
  entidad: { fontSize: 10, color: "#555" },
  titulo: { fontSize: 15, marginTop: 4, fontFamily: "Helvetica-Bold" },
  seccion: { marginBottom: 12 },
  seccionTitulo: { fontSize: 11, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  cuerpo: { textAlign: "justify" },
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 8, color: "#888", textAlign: "center" },
});

export interface DocumentoPdfProps {
  doc: DocumentoRenderizado;
  entidad: string;
  piePagina?: string;
}

function DocumentoPDF({ doc, entidad, piePagina }: DocumentoPdfProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.entidad}>{entidad}</Text>
          <Text style={styles.titulo}>{doc.titulo}</Text>
        </View>
        {doc.secciones.map((s, i) => (
          <View key={i} style={styles.seccion}>
            <Text style={styles.seccionTitulo}>{s.titulo}</Text>
            <Text style={styles.cuerpo}>{s.cuerpo}</Text>
          </View>
        ))}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${piePagina ?? "Generado por la plataforma de gestión de contratistas — OSS"} · Pág. ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

/** Genera el PDF como Buffer (uso en Route Handlers). */
export async function generarPdf(props: DocumentoPdfProps): Promise<Buffer> {
  return renderToBuffer(<DocumentoPDF {...props} />);
}
