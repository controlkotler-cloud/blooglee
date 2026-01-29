

# Plan: Potenciar Captación de Leads con Newsletter Mejorada

## Resumen Ejecutivo

Transformar el formulario de newsletter actual en un sistema robusto de captación de leads con:
1. **Selector binario de perfil**: Solo Empresa o Agencia (eliminar "Me interesa todo")
2. **Campo de nombre**: Para personalización de emails
3. **Checkboxes de consentimiento legal**: GDPR/LOPD obligatorios
4. **Formulario en todas las páginas públicas**: Footer unificado
5. **Automatización de newsletter diaria**: Segmentada por perfil
6. **Templates de email premium**: Uno para cada audiencia

---

## Fase 1: Base de Datos

### 1.1 Modificar tabla `newsletter_subscribers`

Añadir nuevos campos para cumplimiento legal y personalización:

```sql
ALTER TABLE newsletter_subscribers 
ADD COLUMN name TEXT,
ADD COLUMN gdpr_consent BOOLEAN DEFAULT false,
ADD COLUMN marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN consent_date TIMESTAMPTZ;

-- Eliminar 'both' como opción válida, solo 'empresas' o 'agencias'
-- Los existentes con 'both' se mantienen pero nuevos no pueden elegirlo
```

**Campos añadidos:**
| Campo | Tipo | Propósito |
|-------|------|-----------|
| `name` | TEXT | Nombre para personalizar emails |
| `gdpr_consent` | BOOLEAN | Aceptación tratamiento datos |
| `marketing_consent` | BOOLEAN | Aceptación comunicaciones comerciales |
| `consent_date` | TIMESTAMPTZ | Fecha de los consentimientos |

---

## Fase 2: Componente NewsletterForm Mejorado

### 2.1 Nuevo diseño del formulario

```
Variante SIDEBAR (Blog, páginas internas):
┌─────────────────────────────────────────────────────┐
│  📩 Newsletter                                      │
│  Recibe contenido exclusivo cada día en tu email   │
│                                                     │
│  Tu nombre                                          │
│  [_________________________________]                │
│                                                     │
│  Tu email                                           │
│  [_________________________________]                │
│                                                     │
│  Soy:                                               │
│  ┌────────────────┐  ┌────────────────┐            │
│  │ 🏢 EMPRESA     │  │ 📊 AGENCIA     │            │
│  │ Pyme/Autónomo  │  │ de Marketing   │            │
│  └────────────────┘  └────────────────┘            │
│         ↑ Seleccionado                              │
│                                                     │
│  ☑ Acepto la política de privacidad y el           │
│    tratamiento de mis datos *                       │
│                                                     │
│  ☑ Acepto recibir comunicaciones comerciales       │
│    de Blooglee *                                    │
│                                                     │
│  [        Suscribirme        ]                      │
│                                                     │
│  🔒 Tus datos están protegidos. Puedes darte       │
│     de baja en cualquier momento.                   │
└─────────────────────────────────────────────────────┘

Variante FOOTER (Todas las páginas):
┌─────────────────────────────────────────────────────────────────────┐
│  📩 Newsletter · Contenido exclusivo cada día                       │
│                                                                     │
│  [Nombre]  [Email]  [🏢 Empresa ▾]  [Suscribirme →]                 │
│                                                                     │
│  ☑ Acepto la política de privacidad y recibir comunicaciones       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Cambios en el código

**Archivo: `src/components/marketing/NewsletterForm.tsx`**

- Añadir campo `name` (Input)
- Cambiar selector de audiencia a solo 2 opciones con cards visuales:
  - **Empresa**: Icono Building2, subtexto "Pyme / Autónomo / Empresa"
  - **Agencia**: Icono Briefcase, subtexto "Agencia de marketing"
- Eliminar opción "Ambos/Me interesa todo"
- Añadir checkboxes de consentimiento con links a `/privacy`
- Añadir validación: ambos checkboxes obligatorios
- Añadir nueva variante `footer` para el footer global

### 2.3 Iconos mejorados

Cambiar los iconos actuales (Building2, Users) por:
- **Empresa**: `Building2` con estilo card seleccionable
- **Agencia**: `Briefcase` (más representativo que Users)

Eliminar emojis (🏢, 🏬, 📚) y usar iconos Lucide consistentes.

---

## Fase 3: Footer Global con Newsletter

### 3.1 Modificar `PublicFooter.tsx`

Añadir sección de newsletter antes de los links:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FOOTER                                                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📩 NEWSLETTER                                                       │   │
│  │                                                                      │   │
│  │  Recibe el artículo del día en tu email                              │   │
│  │                                                                      │   │
│  │  [Nombre]  [Email]  [🏢 Empresa | 📊 Agencia]  [Suscribirme]          │   │
│  │                                                                      │   │
│  │  ☑ Acepto la política de privacidad y recibir comunicaciones        │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Logo Blooglee]                                                           │
│  Automatiza tu blog...                                                     │
│                                                                             │
│  Producto    Recursos    Legal       Síguenos                              │
│  ─────────   ─────────   ─────────   ─────────                             │
│  Características   Ayuda    Términos    Twitter                            │
│  Precios           Contacto Privacidad  LinkedIn                           │
│  Blog                       Cookies     Instagram                          │
│                                                                             │
│  © 2026 Blooglee. Todos los derechos reservados.                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 4: Hook y Edge Function

### 4.1 Modificar `useNewsletterSubscribe.ts`

Añadir parámetros:
```typescript
subscribe(
  name: string,
  email: string, 
  audience: 'empresas' | 'agencias',
  gdprConsent: boolean,
  marketingConsent: boolean,
  source: string
)
```

### 4.2 Modificar `subscribe-newsletter/index.ts`

- Recibir y validar nuevos campos
- Guardar `name`, `gdpr_consent`, `marketing_consent`, `consent_date`
- Rechazar si no hay consentimientos
- Rechazar si `audience` es 'both' (solo empresas o agencias)

**Validaciones adicionales:**
```typescript
if (!gdprConsent || !marketingConsent) {
  return error("Debes aceptar los consentimientos para suscribirte");
}

if (!['empresas', 'agencias'].includes(audience)) {
  return error("Selecciona si eres Empresa o Agencia");
}
```

---

## Fase 5: Email Templates Mejorados

### 5.1 Email de Bienvenida Personalizado

**Archivo: `subscribe-newsletter/index.ts`**

```html
Asunto: ¡Bienvenido/a ${name}! Tu newsletter de Blooglee está lista 🎉

Hola ${name},

¡Gracias por suscribirte a la newsletter de Blooglee ${audience === 'empresas' ? 'para Empresas' : 'para Agencias'}!

A partir de ahora recibirás:
- Artículos diarios adaptados a ${audience === 'empresas' 
  ? 'tu negocio: estrategias de marketing, SEO y crecimiento digital' 
  : 'tu agencia: escalabilidad, automatización y gestión de clientes'}
- Tips exclusivos para mejorar tu presencia online
- Novedades de Blooglee

[Ver últimos artículos →]

Saludos,
El equipo de Blooglee

---
Puedes darte de baja en cualquier momento haciendo clic aquí.
```

### 5.2 Newsletter Diaria Segmentada

**Archivo: `send-newsletter/index.ts`**

Templates separados para cada audiencia:

**Para Empresas:**
```
Asunto: 📈 ${name}, tu artículo de hoy: ${post.title}

Buenos días, ${name}

Aquí tienes el artículo de hoy pensado para hacer crecer tu negocio:

[Imagen del post]
${post.title}
${post.excerpt}

[Leer artículo completo →]

---
¿Quieres automatizar tu blog? Prueba Blooglee gratis.
```

**Para Agencias:**
```
Asunto: 🚀 ${name}, contenido de hoy para tu agencia: ${post.title}

Buenos días, ${name}

El artículo de hoy te ayudará a escalar tu producción de contenido:

[Imagen del post]
${post.title}
${post.excerpt}

[Leer artículo completo →]

---
Automatiza los blogs de tus clientes con Blooglee.
```

---

## Fase 6: Automatización Completa

### 6.1 Flujo actual (ya implementado)

```
09:00 AM → generate-monthly-articles → genera blog posts
         → send-newsletter → envía emails segmentados
```

### 6.2 Mejoras a implementar

1. **Personalización con nombre**: Usar `name` en el saludo
2. **Segmentación estricta**: Solo enviar el post de la audiencia correspondiente
3. **Link de baja personalizado**: Incluir token único para cancelar

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `newsletter_subscribers` (DB) | +name, +gdpr_consent, +marketing_consent, +consent_date |
| `src/components/marketing/NewsletterForm.tsx` | Rediseño completo con nombre y consentimientos |
| `src/components/marketing/PublicFooter.tsx` | Añadir sección newsletter |
| `src/hooks/useNewsletterSubscribe.ts` | Añadir nuevos parámetros |
| `supabase/functions/subscribe-newsletter/index.ts` | Validar y guardar consentimientos |
| `supabase/functions/send-newsletter/index.ts` | Personalizar con nombre, templates por audiencia |

---

## Textos Legales para Checkboxes

1. **Consentimiento GDPR (obligatorio):**
   > "He leído y acepto la [Política de Privacidad](/privacy) y el tratamiento de mis datos personales."

2. **Consentimiento Marketing (obligatorio):**
   > "Acepto recibir comunicaciones comerciales y novedades de Blooglee por email."

3. **Texto informativo (debajo del botón):**
   > "🔒 Tus datos están seguros. Puedes darte de baja cuando quieras con un solo clic."

---

## Resultado Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Campos requeridos | 1 (email) | 4 (nombre, email, perfil, consentimientos) |
| Segmentación | Empresas/Agencias/Ambos | Solo Empresas o Agencias |
| Cumplimiento GDPR | Implícito | Explícito con registro de fecha |
| Personalización email | Genérico | Con nombre del suscriptor |
| Presencia en web | Solo sidebar blog | Todas las páginas (footer) |
| Tasa conversión esperada | ~2% | ~4% (formulario más corto en footer) |

Este sistema captura leads cualificados con consentimiento explícito, permite segmentación precisa y cumple con RGPD/LOPD para comunicaciones comerciales.

