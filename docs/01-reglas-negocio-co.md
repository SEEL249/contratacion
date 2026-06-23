# 01 — Reglas de negocio (Colombia)

> Insumo para el modelo de datos y la validación. Cubre **parafiscales**, **seguridad social / PILA**, **tipos de vinculación** y su impacto en `CuentaCobro` y `DocumentoAnexo`.
>
> ⚠️ **Aviso legal:** los porcentajes y reglas aquí descritos corresponden al marco general de los contratos de prestación de servicios en Colombia. Las cifras (IBC, tarifas, niveles de riesgo) **deben validarse contra la normativa vigente** y los requisitos específicos de cada entidad antes de usarse en producción. El sistema NO calcula aportes: solo **recibe, valida y archiva** lo que reporta el contratista.

---

## 1. Marco normativo de referencia

| Norma | Tema |
|-------|------|
| Decreto 1273 de 2018 | Pago mes vencido de seguridad social del trabajador independiente; retención. |
| Ley 100 de 1993 | Sistema de seguridad social integral (salud, pensión, riesgos). |
| Decreto 1072 de 2015 | Decreto único reglamentario del sector trabajo (ARL, riesgos). |
| Ley 1562 de 2012 | Afiliación a riesgos laborales de independientes. |
| Decreto 1990 de 2016 | Reglas de cotización y planilla (PILA) para independientes. |

> El equipo debe confirmar la versión vigente de cada norma a la fecha de implementación (este documento se redactó en jun-2026).

---

## 2. Tipos de vinculación

El **tipo de vinculación** define la naturaleza del contrato y, en algunos casos, el nivel de riesgo ARL y el formato de los documentos.

| Código | Etiqueta | Perfil del contratista |
|--------|----------|------------------------|
| `PROFESIONAL` | Servicios profesionales | Título de pregrado, posgrado, maestría o doctorado. |
| `APOYO_GESTION` | Apoyo a la gestión | Bachiller, técnico o tecnólogo. |

**Impacto en el sistema:**
- Es un campo obligatorio en `Contrato` y se **precarga** en `CuentaCobro` (no lo reescribe el contratista, solo lo confirma).
- Puede condicionar la **plantilla** de acta/cuenta de cobro y el **nivel de riesgo ARL** por defecto.

---

## 3. Seguridad social del contratista (PILA)

> **Principio rector:** el contratista es **responsable de su propia seguridad social**. El sistema **NO calcula** aportes ni retenciones. Solo registra el **número de planilla** y la **plataforma de pago**, y valida coherencia básica.

### 3.1 ¿Qué es la PILA?

**PILA** = *Planilla Integrada de Liquidación de Aportes*. Es el documento único con el que se pagan los aportes a salud, pensión y riesgos laborales (ARL). Se diligencia y paga a través de un **operador de información**.

### 3.2 Operadores de información (plataforma de pago)

Catálogo sugerido para el campo `plataformaSeguridadSocial` (enum/config por tenant):

| Valor | Operador |
|-------|----------|
| `SOI` | SOI – Simple (Pago Simple / Servicio Operador de Información) |
| `APORTES_EN_LINEA` | Aportes en Línea |
| `MI_PLANILLA` | Mi Planilla |
| `COMPENSAR` | Compensar |
| `ASOPAGOS` | Asopagos |
| `SIMPLE_SUAPORTE` | SuAporte / Simple |
| `ARUS` | ARUS |
| `OTRO` | Otro (texto libre) |

> El listado debe ser **configurable por tenant** (cada entidad puede aceptar unos operadores y no otros).

### 3.3 Tipos de planilla PILA (cotizante independiente)

| Tipo | Descripción |
|------|-------------|
| `I` | Independientes. |
| `Y` | Independientes con novedad (ingreso/retiro, correcciones). |

> Para contratistas de prestación de servicios, lo habitual es planilla **tipo I**. El campo es informativo y puede usarse en validaciones futuras.

### 3.4 Base de cotización (IBC) — referencia

- El **IBC (Ingreso Base de Cotización)** del independiente por contrato de prestación de servicios se calcula, como regla general, sobre el **40 % del valor mensualizado del contrato**.
- Aportes (tarifas generales de referencia, **a confirmar**):
  - **Salud:** 12,5 % del IBC.
  - **Pensión:** 16 % del IBC.
  - **ARL:** según nivel de riesgo (ver 3.5).
- **Pago mes vencido** (Decreto 1273/2018): se cotiza sobre el ingreso del mes anterior. → la **planilla del período N** suele corresponder al mes en que se ejecutó la actividad reportada.

> El sistema **no** liquida estas cifras. Se documentan solo para diseñar validaciones de coherencia opcionales (p. ej. alertar si el período cotizado no coincide con el mes del informe).

### 3.5 Nivel de riesgo ARL

| Nivel | Riesgo | Ejemplo de actividad |
|-------|--------|----------------------|
| I | Mínimo | Labores administrativas / oficina. |
| II | Bajo | — |
| III | Medio | — |
| IV | Alto | — |
| V | Máximo | Trabajo en alturas, campo, etc. |

> La mayoría de contratistas profesionales/apoyo administrativo se ubican en **nivel I**. El nivel lo asigna la entidad/ARL según el objeto contractual.

### 3.6 Validaciones del sistema sobre la planilla

Al registrar la cuenta de cobro, el sistema valida (sin calcular montos):

- [ ] `numeroPlanilla` presente y con formato no vacío.
- [ ] `plataformaSeguridadSocial` seleccionada del catálogo del tenant.
- [ ] Documento de **planilla de seguridad social adjunto (obligatorio)** — ver `DocumentoAnexo`.
- [ ] (Opcional/configurable) período cotizado coherente con el mes del informe.

---

## 4. Parafiscales

> ⚠️ **Aclaración importante:** los **parafiscales propiamente dichos** (SENA 2 %, ICBF 3 %, Caja de Compensación 4 %) son, por regla general, **obligaciones del empleador frente a trabajadores dependientes** y **NO aplican** al contratista independiente de prestación de servicios. Sin embargo, el documento de especificación menciona un *"Documento de parafiscales (plantilla; varía según el mes)"*.

**Interpretación operativa adoptada:**

En el contexto de contratos de prestación de servicios públicos, lo que las entidades suelen exigir mes a mes como *"parafiscales"* es, en la práctica, una de estas:

1. **Certificación / soporte de pago de aportes** al sistema de seguridad social del período (la propia PILA o una certificación derivada). → ya cubierto por la planilla de seguridad social.
2. Una **plantilla institucional** (formato de la entidad) que el contratista diligencia declarando el cumplimiento de aportes del período.

**Decisión de modelado:**
- Se mantiene `PlantillaParafiscales` y `DocumentoAnexo (tipo = PARAFISCALES)` como **plantilla configurable por tenant**, porque cada entidad define su propio formato y exigibilidad.
- Su **obligatoriedad es configurable por tenant** (algunas entidades lo piden, otras no).
- El contenido variable mes a mes son: período, valor del contrato/cuota, datos del contratista y declaración de aportes.

> **Acción pendiente con el PO (Cesar):** confirmar si el "documento de parafiscales" de las entidades objetivo es (a) la certificación de aportes, (b) un formato propio de declaración, o (c) ambos. De ello depende si se hace obligatorio por defecto.

---

## 5. Resumen de impacto en el modelo de datos

| Concepto | Entidad / campo |
|----------|-----------------|
| Tipo de vinculación | `Contrato.tipoVinculacion`, precargado en `CuentaCobro` |
| Plataforma de pago | `CuentaCobro.plataformaSeguridadSocial` (enum/config tenant) |
| N.º de planilla | `CuentaCobro.numeroPlanilla` |
| Tipo de planilla PILA | `CuentaCobro.tipoPlanilla` (opcional) |
| Planilla adjunta | `DocumentoAnexo` tipo `SEGURIDAD_SOCIAL` (obligatorio) |
| Parafiscales | `DocumentoAnexo` tipo `PARAFISCALES` (config. por tenant) + `PlantillaParafiscales` |
| Nivel de riesgo ARL | `Contrato.nivelRiesgoArl` (opcional) |

---

## 6. Pendientes (para próxima sesión)

- [ ] Confirmar con el PO la naturaleza exacta del "documento de parafiscales".
- [ ] Validar tarifas/IBC vigentes a la fecha de implementación.
- [ ] Definir si se implementa la validación opcional de coherencia período cotizado ↔ mes del informe.
