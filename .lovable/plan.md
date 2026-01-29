
# Plan Optimizado: Sistema Completo de Ayuda, Diagnóstico y Chatbot para Blooglee

## Resumen Ejecutivo

Combinando los dos documentos (Problemas de Integración WordPress + Flujo de Onboarding), este plan implementa un sistema integral de soporte que:

1. **Mejora el flujo de onboarding actual** con diagnóstico progresivo en 3 fases
2. **Expande el Centro de Ayuda** con base de conocimiento buscable
3. **Añade un chatbot inteligente (Bloobot)** para resolver problemas 24/7
4. **Integra Health Check automático** en la configuración de WordPress

Todo manteniendo la estética Aurora/Liquid Blobs de Blooglee y sin modificar funcionalidades existentes.

---

## Fase 1: Base de Datos y Edge Functions

### 1.1 Nueva tabla: `knowledge_base`

Almacena los 45+ problemas de integración WordPress documentados:

```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'seguridad', 'multiidioma', 'permisos', etc.
  subcategory TEXT,
  priority TEXT CHECK (priority IN ('alta', 'media', 'baja')),
  error_code TEXT, -- 'WP_PERMALINKS_NOT_CONFIGURED', '401', '403', etc.
  title TEXT NOT NULL,
  symptoms TEXT[], -- Síntomas que el usuario puede describir
  cause TEXT,
  solution TEXT NOT NULL, -- Markdown con la solución
  solution_steps JSONB, -- Pasos estructurados
  snippet_code TEXT, -- Código PHP/JS si aplica
  related_plugins TEXT[], -- Wordfence, Polylang, etc.
  help_url TEXT, -- Link a tutorial externo si existe
  keywords TEXT[], -- Para búsqueda semántica
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Lectura pública, escritura solo service_role
```

### 1.2 Nueva tabla: `support_conversations`

Para historial del chatbot:

```sql
CREATE TABLE support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  error_context JSONB, -- { code: 403, action: 'publish', site_url: '...' }
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES support_conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  suggested_articles UUID[], -- IDs de knowledge_base sugeridos
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Usuarios solo ven sus conversaciones
```

### 1.3 Edge Function: `wordpress-health-check`

Implementa el sistema de 3 fases del documento:

```
supabase/functions/wordpress-health-check/index.ts
```

**Fase 1 (sin credenciales):**
- GET `/wp-json/` → Verificar API REST accesible
- Validar SSL
- Extraer versión WordPress (X-WP-Version header)
- Detectar estructura permalinks

**Fase 2 (con credenciales):**
- GET `/wp-json/wp/v2/users/me` → Autenticación
- Verificar capabilities: edit_posts, publish_posts, upload_files
- Verificar rol: administrator, editor o author

**Fase 3 (health check completo):**
- POST draft de prueba → Verificar creación posts
- POST imagen de prueba → Verificar subida medios
- GET `/wp-json/` → Detectar plugins (Polylang, WPML, Yoast, etc.)
- GET categorías y taxonomías existentes
- Limpiar posts/imágenes de prueba

**Respuesta estructurada:**

```json
{
  "phase": 3,
  "overall_status": "success" | "warning" | "error",
  "checks": [
    { "id": "api_rest", "status": "ok", "message": "API REST accesible" },
    { "id": "ssl", "status": "ok", "message": "SSL válido" },
    { "id": "version", "status": "ok", "value": "6.4.2" },
    { "id": "auth", "status": "ok", "user_id": 1, "role": "administrator" },
    { "id": "create_post", "status": "ok" },
    { "id": "upload_media", "status": "ok" },
    { "id": "polylang", "status": "warning", "message": "Detectado - requiere snippet" }
  ],
  "detected_plugins": ["polylang", "yoast-seo"],
  "languages": [{ "code": "es", "name": "Español" }, { "code": "en", "name": "English" }],
  "categories": [...],
  "errors": [],
  "recommendations": [
    { "priority": "alta", "article_id": "...", "title": "Configurar Polylang para API" }
  ]
}
```

### 1.4 Edge Function: `support-chatbot`

```
supabase/functions/support-chatbot/index.ts
```

**Funcionalidades:**
- Búsqueda semántica en `knowledge_base` usando keywords
- Mapeo automático de códigos de error (401, 403, 404, etc.)
- Contexto de conversación (últimos N mensajes)
- Streaming de respuestas con Lovable AI (Gemini 2.5 Flash)
- Sugerencias de artículos relacionados

**System prompt personalizado:**

```
Eres Bloobot, el asistente de soporte de Blooglee. Tu objetivo es ayudar a los usuarios a resolver problemas de integración con WordPress.

REGLAS:
1. Sé amable y conciso
2. Si detectas un código de error, usa la base de conocimiento para dar soluciones específicas
3. Ofrece pasos numerados y claros
4. Si el problema requiere cambios en WordPress, indica exactamente dónde ir
5. Si no puedes resolver, sugiere contactar soporte@blooglee.com
6. NUNCA inventes soluciones - usa solo la base de conocimiento
```

---

## Fase 2: Componentes UI

### 2.1 Onboarding Mejorado

**Modificar `src/pages/Onboarding.tsx`:**

Añadir nuevo paso 4 mejorado con flujo de 3 fases:

```text
Paso 4: WordPress (Nuevo Flujo)
┌─────────────────────────────────────────────────────┐
│  [Logo Blooglee]                                    │
│                                                     │
│  Conecta tu WordPress                               │
│  Paso 4 de 4                                        │
│  [████████████████░░░░] 80%                         │
│                                                     │
│  ☐ No quiero conectar WordPress ahora               │
│                                                     │
│  URL de tu sitio WordPress *                        │
│  [https://tusitio.com              ] [Verificar →]  │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  FASE 1: Verificando configuración...               │
│  ✓ API REST accesible                               │
│  ✓ SSL válido                                       │
│  ✓ WordPress 6.4.2                                  │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ✅ Tu WordPress está listo                         │
│                                                     │
│  ⚠ ANTES DE CONTINUAR                               │
│  ¿Usas alguno de estos plugins?                     │
│  [Wordfence] [iThemes] [Sucuri] [Polylang] [WPML]   │
│     └─→ Ver guía de configuración                   │
│                                                     │
│  Ahora genera una clave de aplicación:              │
│  [Ver tutorial paso a paso →]                       │
│                                                     │
│  Usuario *          [admin                       ]  │
│  Clave aplicación * [••••••••••••••••           ]  │
│                                                     │
│  [← Atrás]                    [Conectar WordPress]  │
└─────────────────────────────────────────────────────┘
```

**Nuevo componente: `WordPressOnboardingStep.tsx`**

Maneja las 3 fases con estados visuales:
- `idle` → Esperando URL
- `phase1_testing` → Spinner + checks animados
- `phase1_error` → Error + solución específica
- `phase1_success` → Checklist pre-clave + tutorial
- `phase2_testing` → Verificando credenciales
- `phase2_error` → Diagnóstico firewall con selector
- `phase3_testing` → Health check completo
- `success` → Conexión exitosa + warnings

### 2.2 Componente Health Check

**Nuevo: `src/components/saas/WordPressHealthCheck.tsx`**

Integrado en `WordPressConfigForm.tsx`:

```text
┌─────────────────────────────────────────────────────┐
│  DIAGNÓSTICO DE CONEXIÓN                            │
│                                                     │
│  ✓ API REST accesible                               │
│  ✓ SSL válido                                       │
│  ✓ WordPress 6.4.2                                  │
│  ✓ Permisos correctos                               │
│  ⚠ Polylang detectado                               │
│    └─ [Ver cómo configurar para API →]              │
│  ✓ Puede crear posts                                │
│  ✓ Puede subir imágenes                             │
│                                                     │
│  Estado: ✅ Listo (con advertencias)                │
│                                                     │
│  [Ejecutar diagnóstico completo]                    │
└─────────────────────────────────────────────────────┘
```

### 2.3 Centro de Ayuda Expandido

**Modificar `src/pages/HelpPage.tsx`:**

```text
┌─────────────────────────────────────────────────────┐
│  [← Dashboard]  [Logo Blooglee]                     │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  🔍 Buscar en la base de conocimiento...      │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  📂 CATEGORÍAS                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │🔒Security│ │📝WordPress│ │🌍 Idiomas│            │
│  │11 artículos│4 artículos │7 artículos│            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │🖥️ Hosting│ │⚡ Caché   │ │🔐 SSL    │            │
│  │5 artículos│3 artículos │2 artículos│            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│  🔥 PROBLEMAS FRECUENTES                            │
│  ├─ Wordfence bloquea claves de aplicación         │
│  ├─ Error 403 Forbidden al conectar                │
│  ├─ Polylang no publica en idioma correcto         │
│  └─ [Ver todos →]                                  │
│                                                     │
│  ❓ PREGUNTAS FRECUENTES                            │
│  [Accordion actual expandido + nuevas FAQs]         │
│                                                     │
│  📧 ¿Necesitas más ayuda?                           │
│  [soporte@blooglee.com]  [💬 Hablar con Bloobot]   │
└─────────────────────────────────────────────────────┘
```

**Nueva página: `src/pages/KnowledgeArticle.tsx`**

Ruta: `/help/article/:slug`

```text
┌─────────────────────────────────────────────────────┐
│  [← Centro de Ayuda]                                │
│                                                     │
│  [🔒 Seguridad] [Prioridad Alta]                    │
│                                                     │
│  # Wordfence bloquea claves de aplicación           │
│                                                     │
│  ## Síntomas                                        │
│  - Error 403 al conectar WordPress                  │
│  - Las credenciales son correctas pero falla        │
│                                                     │
│  ## Causa                                           │
│  Wordfence tiene una regla que bloquea...          │
│                                                     │
│  ## Solución                                        │
│  1. Ve a Wordfence → Firewall → Manage Firewall    │
│  2. Busca "Application Passwords"                   │
│  3. Desactiva la regla                              │
│                                                     │
│  [📸 Ver tutorial con capturas]                     │
│                                                     │
│  ## ¿Sigue sin funcionar?                           │
│  [💬 Hablar con Bloobot]                            │
└─────────────────────────────────────────────────────┘
```

### 2.4 Chatbot Widget (Bloobot)

**Nuevo: `src/components/saas/SupportChatWidget.tsx`**

Botón flotante estilo Blooglee (gradiente aurora):

```text
         ┌─────┐
         │ 💬  │  ← Botón flotante esquina inferior derecha
         └─────┘     Gradiente violet → fuchsia
```

**Nuevo: `src/components/saas/SupportChatDialog.tsx`**

```text
┌─────────────────────────────────────────────────────┐
│  💬 Bloobot                              [─] [×]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  👋 ¡Hola! Soy Bloobot, tu asistente de soporte.    │
│  ¿En qué puedo ayudarte?                            │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🔌 Problemas de conexión WordPress            │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 📝 Errores al publicar artículos              │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🌍 Configuración de idiomas                   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                     │
│  [Usuario]: Tengo error 403 al conectar             │
│                                                     │
│  [Bloobot]: Entiendo que ves un error 403. Esto     │
│  suele indicar un firewall bloqueando. ¿Usas        │
│  alguno de estos plugins?                           │
│  • Wordfence                                        │
│  • iThemes Security                                 │
│  • Sucuri                                           │
│                                                     │
│  📚 Artículos relacionados:                         │
│  └─ [Wordfence bloquea claves de aplicación →]      │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Escribe tu pregunta o pega el error...]    [➤]   │
└─────────────────────────────────────────────────────┘
```

**Integración contextual:**

Cuando ocurre un error en `WordPressPublishDialogSaas` o `WordPressConfigForm`:

```tsx
// Al detectar error 403
openBloobotWithContext({
  type: 'error',
  code: 403,
  action: 'wordpress_connect',
  siteId: site.id,
  message: 'Error al conectar con WordPress'
});
```

### 2.5 Biblioteca de Snippets

**Nuevo: `src/components/saas/CodeSnippetsLibrary.tsx`**

Accesible desde Help y desde warnings del Health Check:

```text
┌─────────────────────────────────────────────────────┐
│  📋 SNIPPETS DE CÓDIGO                              │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🌍 Polylang - Soporte API REST                │  │
│  │ Permite publicar en el idioma correcto vía API │  │
│  │ [Ver código] [Copiar] [Ver tutorial]           │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🌐 WPML - Soporte API REST                    │  │
│  │ Configura WPML para aceptar idioma en API      │  │
│  │ [Ver código] [Copiar] [Ver tutorial]           │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🔒 Whitelist Blooglee en Firewall             │  │
│  │ Añade excepción para IPs de Blooglee           │  │
│  │ [Ver código] [Copiar]                          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Fase 3: Hooks y Lógica

### Nuevos hooks a crear:

| Hook | Propósito |
|------|-----------|
| `useKnowledgeBase.ts` | Búsqueda y lectura de artículos |
| `useSupportChat.ts` | Gestión de conversaciones con Bloobot |
| `useWordPressHealthCheck.ts` | Ejecutar diagnóstico 3 fases |

---

## Fase 4: Datos Iniciales

### Migración con 45+ artículos de knowledge_base

Basados en el documento de problemas, organizados por:

**Prioridad ALTA (11):**
1. Wordfence bloquea claves de aplicación
2. iThemes Security deshabilita API REST
3. Polylang no publica en idioma correcto
4. WPML no reconoce idioma en publicación API
5. ModSecurity bloquea peticiones POST
6. Cloudflare Security Level alto
7. API REST deshabilitada completamente
8. Permalinks no configurados (Plain)
9. Certificado SSL inválido
10. Application Passwords deshabilitadas
11. WordPress versión anterior a 5.6

**Prioridad MEDIA (19):**
All In One WP Security, Sucuri, Limit Login Attempts, permisos usuario, claves revocadas, WP Rocket, W3 Total Cache, rate limiting, post_max_size, Yoast SEO, templates, .htaccess, CORS, mixed content, ACF, etc.

**Prioridad BAJA (15+):**
TranslatePress, qTranslate, Divi, Elementor, WPBakery, collation, database repair, etc.

### FAQs Expandidas

Añadir al `HelpPage.tsx` actual:

| Nueva FAQ | Categoría |
|-----------|-----------|
| ¿Cómo creo una contraseña de aplicación? | WordPress |
| ¿Por qué no puedo conectar con Wordfence activo? | Seguridad |
| ¿Cómo configuro Polylang para la API? | Multiidioma |
| ¿Qué hago si veo error 403 Forbidden? | Errores |
| ¿Qué hago si veo error 401 Unauthorized? | Errores |
| ¿Por qué no aparece la imagen destacada? | Medios |
| ¿Cómo verifico si mi API REST funciona? | WordPress |
| ¿Mi hosting puede bloquear Blooglee? | Hosting |
| ¿Necesito WordPress 5.6 o superior? | Requisitos |
| ¿Qué permisos necesita mi usuario? | Permisos |

---

## Estructura de Archivos Final

```text
src/
├── components/
│   └── saas/
│       ├── SupportChatWidget.tsx         # NUEVO - Botón flotante
│       ├── SupportChatDialog.tsx         # NUEVO - Dialog del chat
│       ├── WordPressHealthCheck.tsx      # NUEVO - Diagnóstico visual
│       ├── WordPressOnboardingStep.tsx   # NUEVO - Paso 4 mejorado
│       ├── CodeSnippetsLibrary.tsx       # NUEVO - Biblioteca snippets
│       ├── KnowledgeSearch.tsx           # NUEVO - Buscador
│       └── WordPressConfigForm.tsx       # MODIFICAR - Integrar health check
│
├── pages/
│   ├── HelpPage.tsx                      # MODIFICAR - Expandir con categorías
│   ├── KnowledgeArticle.tsx              # NUEVO - Detalle artículo
│   └── Onboarding.tsx                    # MODIFICAR - Nuevo paso 4
│
├── hooks/
│   ├── useKnowledgeBase.ts               # NUEVO
│   ├── useSupportChat.ts                 # NUEVO
│   └── useWordPressHealthCheck.ts        # NUEVO
│
└── data/
    └── codeSnippets.ts                   # NUEVO - Snippets predefinidos

supabase/
└── functions/
    ├── wordpress-health-check/
    │   └── index.ts                      # NUEVO - Diagnóstico 3 fases
    └── support-chatbot/
        └── index.ts                      # NUEVO - Bloobot
```

---

## Orden de Implementación

| Fase | Tarea | Prioridad |
|------|-------|-----------|
| 1.1 | Tabla knowledge_base + migración datos | Alta |
| 1.2 | Edge Function wordpress-health-check | Alta |
| 2.1 | WordPressHealthCheck component | Alta |
| 2.2 | HelpPage expandido + FAQs nuevas | Alta |
| 2.3 | KnowledgeArticle page | Alta |
| 1.3 | Tablas support_conversations/messages | Media |
| 1.4 | Edge Function support-chatbot | Media |
| 2.4 | SupportChatWidget + SupportChatDialog | Media |
| 2.5 | WordPressOnboardingStep mejorado | Media |
| 2.6 | CodeSnippetsLibrary | Baja |
| 3.1 | Integración contextual de errores | Baja |

---

## Consistencia Visual

Todos los componentes nuevos usarán:

- **Tipografía**: Sora para títulos, Inter para cuerpo
- **Colores**: Gradiente aurora (violet → fuchsia → orange)
- **Cards**: `glass-card` o Card estándar de shadcn
- **Badges**: Estilo `badge-aurora` para categorías
- **Botones**: `btn-aurora` para CTAs principales
- **Estados**: ✓ verde, ⚠ amarillo/naranja, ❌ rojo
- **Animaciones**: Suaves, respetando `prefers-reduced-motion`

---

## Resultado Esperado

| Métrica | Mejora Estimada |
|---------|-----------------|
| Tasa éxito onboarding WordPress | +40% (60% → 85%) |
| Tickets de soporte | -60% |
| Tiempo promedio de setup | -50% (15 min → 7 min) |
| Usuarios que resuelven solos | +80% |

Este sistema transforma el soporte reactivo en soporte proactivo, detectando problemas antes de que frustren al usuario y guiándolo con soluciones específicas para su configuración.
