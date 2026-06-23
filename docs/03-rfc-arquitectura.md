# 03 — RFC de arquitectura

> Decisiones de arquitectura para la plataforma de gestión de contratistas. Cubre **multi-tenancy**, **autenticación/autorización**, **almacenamiento de archivos**, **flujo de IA**, **generación de documentos** y **notificaciones**.
>
> Estado: **propuesta (v1)** — Fase 2 del plan. Requiere validación del equipo técnico (Hito H2).

---

## 1. Visión general

Aplicación full-stack **Next.js (App Router)** desplegada en **Vercel**, con **PostgreSQL** vía **Prisma**. Estructura por dominios. IA mediante **Grok (xAI)**. Archivos en **Vercel Blob / S3**.

```
┌──────────────────────────────────────────────────────────┐
│                     Next.js (Vercel)                       │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ App Router │  │ Server       │  │ Route Handlers    │  │
│  │ (UI/RSC)   │  │ Actions      │  │ (Grok, mail, blob)│  │
│  └─────┬──────┘  └──────┬───────┘  └─────────┬─────────┘  │
│        │                │                    │            │
│        └────────────────┴────────────────────┘            │
│                         │                                  │
│              ┌──────────▼──────────┐                       │
│              │   Capa de dominio    │ (modules/*)          │
│              │  + tenant guard      │                       │
│              └──────────┬──────────┘                       │
└─────────────────────────┼─────────────────────────────────┘
            ┌──────────────┼───────────────┐
            ▼              ▼               ▼
      ┌──────────┐  ┌────────────┐  ┌──────────────┐
      │PostgreSQL│  │ Blob / S3  │  │  Grok / SMTP │
      │ (Prisma) │  │ (archivos) │  │  (IA / mail) │
      └──────────┘  └────────────┘  └──────────────┘
```

---

## 2. Multi-tenancy

### Decisión: **Shared database, shared schema, discriminador `tenantId`**

| Opción | Aislamiento | Costo/Complejidad | Decisión |
|--------|-------------|-------------------|----------|
| DB por tenant | Máximo | Alto (provisión, migraciones N) | ❌ |
| Schema por tenant | Alto | Medio-alto | ❌ (futuro si escala) |
| **Shared + `tenantId`** | Lógico (app) | Bajo | ✅ **Elegida** |

**Razones:** número moderado de tenants (entidades públicas), simplicidad operativa en Vercel + Postgres gestionado, migraciones únicas, costo bajo. Es la convención que mejor se alinea con "schema Prisma como fuente de verdad".

### Mecanismos de aislamiento (defensa en profundidad)

1. **`tenantId` obligatorio** en todas las entidades de negocio.
2. **Tenant context** derivado de la sesión (nunca de input del cliente). Helper `getTenantContext()`.
3. **Wrapper de acceso a datos** que **inyecta `tenantId` automáticamente** en toda consulta (Prisma extension / repositorio por dominio). Prohibido llamar a `prisma` "crudo" desde la capa de dominio.
4. **Validación en cada Server Action / Route Handler**: el recurso pertenece al tenant de la sesión.
5. (Recomendado a futuro) **RLS de PostgreSQL** como red de seguridad a nivel de BD.

> ⚠️ El **superadmin (OSS)** opera fuera del scope de un tenant: usa rutas y consultas separadas con verificación de rol `SUPERADMIN`. Nunca mezclar consultas de superadmin con el wrapper tenant-scoped.

---

## 3. Autenticación y autorización

### Autenticación: **Auth.js (NextAuth v5)**

- Estrategia: credenciales + (opcional) proveedor OIDC institucional a futuro.
- Sesión incluye: `userId`, `tenantId`, `role`.
- El `tenantId` y `role` se fijan **en el servidor** al iniciar sesión; el cliente nunca los envía.

### Modelo de roles (RBAC)

```
SUPERADMIN              → global, gestiona tenants/planes/soporte
ADMIN_TENANT            → configura plantillas, usuarios, parámetros del tenant
PERSONA_CONTRATACION    → crea contratos, revisa, aprueba/rechaza
SUPERVISOR              → ve informe de supervisión del mes actual
CONTRATISTA             → crea cuentas de cobro, informes, sube documentos
```

### Autorización

- **Matriz de permisos por rol** centralizada (`src/lib/auth/permissions.ts`).
- Cada Server Action verifica: (1) sesión válida, (2) rol autorizado, (3) recurso ∈ tenant, (4) reglas de negocio (p. ej. supervisor solo mes actual).
- **Un usuario pertenece a un tenant** (`User.tenantId`). El superadmin es la excepción (`tenantId = null`).

> **Decisión abierta:** ¿un mismo contratista (persona) puede tener cuentas en varios tenants? El documento dice que un contratista puede tener contratos "de la misma o distintas entidades". → Modelado: la **persona** puede existir en varios tenants como **usuarios distintos** (1 User por tenant) **o** como un User global con membresías. Se adopta inicialmente **1 User por tenant** (más simple, aislamiento fuerte); revisar si se requiere SSO de contratista entre entidades.

---

## 4. Almacenamiento de archivos

### Decisión: **Vercel Blob** (S3-compatible como alternativa)

- Evidencias (foto/PDF/DOC/TXT/video), documentos anexos, firmas.
- **Ruta lógica por tenant:** `tenants/{tenantId}/contratos/{contratoId}/cuentas/{cuentaId}/...` para aislamiento y trazabilidad.
- Acceso mediante **URLs firmadas** con expiración; nunca exponer blobs públicos.
- Metadatos (nombre, tipo, tamaño, hash, autor) en BD (`Evidencia`, `DocumentoAnexo`, `Firma`).
- Validación de **tipo MIME** y **tamaño máximo** (configurable por tenant).
- **Firma:** soportar (a) subida de imagen y (b) dibujo en canvas → se persiste como imagen.

---

## 5. Integración de IA (Grok)

- Encapsulada en `src/lib/ai/grok.ts`. La capa de dominio nunca llama a la API directamente.
- Llamadas desde **Route Handlers** (no en el render) por latencia/timeout; UI muestra estado de progreso.
- Prompts **versionados** (ver `docs/02-prompts-grok.md`).
- Persistir texto original + generado + versión de prompt + modelo (trazabilidad).
- Manejo de errores: reintentos, timeouts, fallback a edición manual si la IA falla.
- Estándar de redacción **configurable por tenant**.

---

## 6. Generación de documentos (PDF)

- Plantillas como **componentes server-side (React) → HTML → PDF**.
- Campos variables inyectados desde los datos del período (precargados del contrato + ingresados).
- Documentos: cuenta de cobro, informe de actividades, informe de supervisión, actas (inicial/parcial/final), parafiscales.
- **Coherencia garantizada**: una sola fuente de datos alimenta todos los documentos del período (cuenta ↔ cuota ↔ acta ↔ informe).
- Librería sugerida: render con React + `@react-pdf/renderer` o HTML→PDF (Puppeteer/serverless-compatible). **Decisión pendiente** según compatibilidad con Vercel.

---

## 7. Notificaciones por correo

- Disparadas en el flujo de revisión: **aprobación** y **rechazo con observaciones**.
- Servicio en `src/lib/mail/`. Proveedor: Resend / SMTP institucional (config por entorno).
- Plantillas de correo configurables; incluir enlace al recurso.

---

## 8. Estructura del repositorio (por dominios)

```
src/
  app/                    # App Router (rutas, layouts, RSC)
  lib/
    auth/                 # Auth.js, permisos, tenant context
    db/                   # Prisma client + wrapper tenant-scoped
    ai/                   # grok.ts + prompts versionados
    mail/                 # envío de correos
    storage/              # blob/S3 + URLs firmadas
    pdf/                  # render de documentos
  modules/
    contratos/            # CRUD contratos, obligaciones, asignación
    cuentas-cobro/        # cuentas de cobro + período
    informes/             # informe de actividades + supervisión
    actas/                # inicial / parcial / final
    revisiones/           # aprobar/rechazar + observaciones
    plantillas/           # plantillas por tenant
    tenants/              # gestión de tenants (superadmin/admin)
  components/             # UI compartida
prisma/
  schema.prisma          # FUENTE DE VERDAD
docs/                     # especificación, RFC, reglas de negocio
```

---

## 9. Calidad e infraestructura

- **TypeScript estricto** + **Zod** para validación de inputs (límite del sistema).
- **GitHub Actions**: lint + typecheck + test en cada PR; deploy continuo a Vercel.
- Migraciones con `prisma migrate`. Entornos: `preview` (Vercel) + `production`.
- Variables de entorno documentadas en `.env.example`.

---

## 10. Decisiones (resueltas en Sesión 2)

- [x] **Contratista multi-tenant:** 1 User por tenant (aislamiento fuerte, más simple). Revisar SSO entre entidades solo si el negocio lo exige.
- [x] **Motor de PDF:** `@react-pdf/renderer` (JS puro, compatible con serverless de Vercel, sin Chromium).
- [x] **RLS en PostgreSQL:** se difiere post-MVP. Aislamiento por ahora vía Prisma Client Extension (`src/lib/db/tenant-scope.ts`).
- [x] **Proveedor de correo:** Resend (`src/lib/mail/mail.ts`).
- [x] **Obligatoriedad de parafiscales:** configurable por tenant, **no obligatorio por defecto** (`tenant.config.parafiscalesObligatorio`). Pendiente confirmación final del PO sobre el formato.

### Pendientes que requieren al PO (Cesar)
- [ ] Naturaleza exacta del "documento de parafiscales" y si alguna entidad lo exige obligatorio.
- [ ] Validar tarifas/IBC vigentes (ver `docs/01-reglas-negocio-co.md`).
