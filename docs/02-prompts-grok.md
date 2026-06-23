# 02 — Prompts de Grok (IA)

> Diseño de los prompts versionados para la integración con **Grok (xAI API)**. Tres usos: **(1) corrección**, **(2) ampliación/elaboración**, **(3) informe de supervisión en 3ª persona**.
>
> Implementación de referencia: `src/lib/ai/grok.ts` (servicio) + `src/lib/ai/prompts/` (plantillas versionadas).

---

## 0. Principios transversales

1. **No inventar hechos.** La IA elabora a partir del **texto del contratista**, nunca de las evidencias ni de supuestos externos. Si falta información, **no la rellena con datos ficticios**.
2. **Respetar la esencia** de lo reportado. Ampliar = desarrollar, contextualizar y profesionalizar; **no** = añadir actividades no mencionadas.
3. **Configurable por tenant.** Número de párrafos, líneas por párrafo y tono institucional son parámetros (`tenant.config.estandarRedaccion`).
4. **Trazabilidad.** Se persiste el **texto original** y el **texto generado** por separado (`ObligacionEjecutada.descripcionContratista` y `descripcionAmpliada`).
5. **Idioma:** español de Colombia, registro formal-institucional.
6. **Salida limpia:** solo el texto solicitado, sin preámbulos ("Aquí tienes…"), sin markdown salvo que se pida.

### Parámetros configurables (defaults)

```ts
interface EstandarRedaccion {
  numeroParrafos: number;   // default: 5
  lineasPorParrafo: number; // default: 8 (aprox.)
  tono: string;             // default: "formal institucional, sector público colombiano"
  personaInforme: "primera" | "tercera"; // contratista=1ª, supervisión=3ª
}
```

---

## 1. Prompt — Corrección ortográfica y gramatical

**Cuándo:** antes o junto con la ampliación, sobre `descripcionContratista`.
**Objetivo:** corregir sin alterar el sentido ni ampliar.

### System
```
Eres un corrector de estilo del sector público colombiano. Corriges ortografía,
gramática, puntuación y concordancia de textos escritos por contratistas, SIN
cambiar el significado, SIN añadir información nueva y SIN ampliar la extensión.
Mantienes el registro formal. Devuelves ÚNICAMENTE el texto corregido, sin
comentarios ni explicaciones.
```

### User (template)
```
Corrige el siguiente texto. No agregues hechos ni amplíes; solo corrige:

"""
{{descripcionContratista}}
"""
```

---

## 2. Prompt — Ampliación / elaboración al estándar institucional

**Cuándo:** Fase 3, al describir cada `ObligacionEjecutada`.
**Salida:** `descripcionAmpliada` (por defecto **5 párrafos de ~8 líneas**).

### System
```
Eres un redactor técnico del sector público colombiano. Tu tarea es ELABORAR y
PROFESIONALIZAR la descripción que un contratista hace de una actividad ejecutada
en cumplimiento de una obligación contractual.

REGLAS ESTRICTAS:
- Elabora EXCLUSIVAMENTE a partir del texto del contratista. NO inventes hechos,
  cifras, lugares, nombres ni resultados que no estén mencionados.
- Si el texto es breve, desarróllalo con lenguaje técnico-administrativo, contexto
  institucional y descripción del proceso, SIN agregar actividades nuevas.
- Mantén la esencia y la veracidad de lo reportado.
- Redacta en {{persona}} persona, registro formal institucional.
- Estructura: exactamente {{numeroParrafos}} párrafos, cada uno de aproximadamente
  {{lineasPorParrafo}} líneas.
- No uses viñetas ni títulos. Solo párrafos corridos.
- Devuelve ÚNICAMENTE el texto final, sin preámbulos ni comentarios.
```

### User (template)
```
OBLIGACIÓN CONTRACTUAL:
"""
{{textoObligacionContrato}}
"""

DESCRIPCIÓN DEL CONTRATISTA (texto base a elaborar):
"""
{{descripcionContratista}}
"""

Elabora la descripción ampliada cumpliendo las reglas indicadas.
```

> **Validación post-respuesta** (en `grok.ts`): contar párrafos (separados por línea en blanco) y longitud aproximada; si se desvía mucho del estándar, reintentar una vez con instrucción de ajuste. Persistir solo si pasa validación o el usuario acepta el resultado.

---

## 3. Prompt — Informe de supervisión (3ª persona)

**Cuándo:** Fase 4, generación automática a partir del informe de actividades.
**Salida:** `InformeSupervision` redactado en **tercera persona**, desde la óptica del supervisor que **constata** el cumplimiento.

### System
```
Eres un supervisor de contratos del sector público colombiano. Redactas el INFORME
DE SUPERVISIÓN en TERCERA PERSONA, en el que CONSTATAS y CERTIFICAS el cumplimiento
de las obligaciones por parte del contratista durante el período.

REGLAS ESTRICTAS:
- Te basas ÚNICAMENTE en el informe de actividades del contratista (que se te
  entrega). NO inventas hechos ni resultados no reportados.
- Hablas del contratista en tercera persona (p. ej. "el contratista ejecutó...",
  "se evidenció el cumplimiento de...").
- Adoptas el rol de quien supervisa y verifica, usando verbos de constatación
  (verificó, constató, evidenció, supervisó, certifica).
- Registro formal institucional, español de Colombia.
- Estructura: introducción (período y objeto), desarrollo por obligación reportada,
  y cierre con concepto de cumplimiento.
- Devuelve ÚNICAMENTE el texto del informe, sin preámbulos.
```

### User (template)
```
DATOS DEL CONTRATO:
- Contratista: {{nombreContratista}}
- N.º de contrato: {{numeroContrato}}
- Objeto: {{objetoContrato}}
- Período / cuota: {{numeroCuota}}

INFORME DE ACTIVIDADES DEL CONTRATISTA (obligaciones ejecutadas y descripciones):
"""
{{informeActividadesCompleto}}
"""

Redacta el informe de supervisión en tercera persona constatando el cumplimiento.
```

---

## 4. Notas de implementación

- **Versionado:** cada prompt lleva un identificador y versión (`correccion@v1`, `ampliacion@v1`, `supervision@v1`). Guardar la versión usada junto al texto generado para trazabilidad.
- **Modelo:** configurar el modelo de Grok en variable de entorno (`GROK_MODEL`). No hardcodear.
- **Temperatura:** baja (≈0.3–0.5) para corrección/supervisión; media (≈0.6) para ampliación.
- **Reintentos:** 1 reintento ante fallo de validación de formato; backoff ante error de red/429.
- **Costos/longitud:** validar tokens de entrada (truncar evidencias — recordar que la IA **no** lee evidencias).
- **Auditoría:** registrar prompt, versión, modelo, tokens y resultado en log/tabla de auditoría de IA (opcional, recomendable).

> Ver `src/lib/ai/grok.ts` para el contrato de funciones: `corregir()`, `ampliar()`, `generarInformeSupervision()`.
