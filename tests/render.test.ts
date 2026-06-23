import { describe, it, expect } from "vitest";
import { renderPlantilla, type PlantillaContenido } from "@/lib/documentos/render";

const plantilla: PlantillaContenido = {
  titulo: "CUENTA DE COBRO N.º {{numeroCuota}}",
  secciones: [
    { titulo: "DATOS", cuerpo: "{{nombre}}, C.C. {{cedula}}" },
    { titulo: "VALOR", cuerpo: "Cuota por {{valor}}" },
  ],
  campos: ["numeroCuota", "nombre", "cedula", "valor"],
};

describe("renderPlantilla", () => {
  it("reemplaza todos los marcadores con datos completos", () => {
    const r = renderPlantilla(plantilla, {
      numeroCuota: 1,
      nombre: "Ana",
      cedula: "123",
      valor: "5000000",
    });
    expect(r.titulo).toBe("CUENTA DE COBRO N.º 1");
    expect(r.secciones[0].cuerpo).toBe("Ana, C.C. 123");
    expect(r.secciones[1].cuerpo).toBe("Cuota por 5000000");
    expect(r.faltantes).toEqual([]);
  });

  it("reporta los marcadores sin valor y los deja sin reemplazar", () => {
    const r = renderPlantilla(plantilla, { numeroCuota: 2, nombre: "Ana" });
    expect(r.faltantes).toContain("cedula");
    expect(r.faltantes).toContain("valor");
    expect(r.secciones[0].cuerpo).toContain("{{cedula}}");
  });

  it("trata cadena vacía como faltante", () => {
    const r = renderPlantilla(plantilla, { numeroCuota: 1, nombre: "", cedula: "1", valor: "1" });
    expect(r.faltantes).toContain("nombre");
  });
});
