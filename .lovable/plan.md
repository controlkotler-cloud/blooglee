
# Plan: Mejoras de Navegacion, Autor del Blog y Lead Magnets

## Analisis del Estado Actual

He analizado el codigo y encontrado:

1. **Navegacion actual**: Solo 4 enlaces (Caracteristicas, Precios, Blog, Contacto) en navbar y footer basico
2. **Autor del blog**: "Equipo Blooglee" esta definido en:
   - `supabase/functions/generate-blog-blooglee/index.ts` (linea 679)
   - `supabase/migrations/...` (DEFAULT para la tabla blog_posts)
   - `src/data/blogPosts.ts` (datos estaticos)
3. **Recursos actuales**: Pagina basica sin lead magnets descargables

---

## Tarea 1: Estrategia de Enlaces para Paginas SEO

**Pregunta**: Las paginas creadas (/para/clinicas, /alternativas, /como-funciona...) pueden funcionar de dos formas:

**Opcion A: Solo landings SEO (sin enlace visible)**
- Captan trafico organico de busquedas especificas
- No saturan la navegacion
- El usuario llega desde Google directamente

**Opcion B: Enlazar estrategicamente**
- Anadir en el footer una seccion "Soluciones" o "Para ti" con los casos de uso
- Anadir menu desplegable en la navbar con subcategorias

**Recomendacion**: Enfoque hibrido:
1. **Footer**: Anadir seccion "Soluciones" con enlaces a casos de uso y alternativas
2. **Navbar**: Mantener limpia (sin sobrecarga) pero anadir dropdown en "Caracteristicas" que incluya "Como funciona"
3. **Pagina Recursos**: Enlazar desde footer (ya existe en estructura)

### Cambios propuestos

**PublicFooter.tsx**:
```typescript
const footerLinks = {
  producto: [
    { label: 'Características', href: '/features' },
    { label: 'Cómo funciona', href: '/como-funciona' },
    { label: 'Precios', href: '/pricing' },
  ],
  soluciones: [
    { label: 'Para clínicas', href: '/para/clinicas' },
    { label: 'Para agencias', href: '/para/agencias-marketing' },
    { label: 'Para ecommerce', href: '/para/tiendas-online' },
    { label: 'Para autónomos', href: '/para/autonomos' },
  ],
  recursos: [
    { label: 'Blog', href: '/blog' },
    { label: 'Recursos', href: '/recursos' },
    { label: 'Alternativas', href: '/alternativas' },
    { label: 'Ayuda', href: '/help' },
  ],
  legal: [...],
};
```

---

## Tarea 2: Cambiar "Equipo Blooglee" por "Generado por Blooglee"

### Archivos a modificar

| Archivo | Linea | Cambio |
|---------|-------|--------|
| `supabase/functions/generate-blog-blooglee/index.ts` | 679 | `author_name: "Generado por Blooglee"` |
| `supabase/functions/generate-blog-blooglee/index.ts` | 681 | `author_role: "IA de Blooglee"` |

**Nota**: Los posts existentes en la base de datos mantendran "Equipo Blooglee". Los nuevos posts usaran "Generado por Blooglee".

Para actualizar posts existentes, se necesitaria un UPDATE SQL:
```sql
UPDATE blog_posts 
SET author_name = 'Generado por Blooglee',
    author_role = 'IA de Blooglee'
WHERE author_name = 'Equipo Blooglee';
```

---

## Tarea 3: Sistema de Lead Magnets

### 3.1 Arquitectura propuesta

Crear un sistema de descarga de PDFs que capture emails antes de la descarga.

**Flujo**:
1. Usuario ve el recurso en /recursos o en pagina de sector
2. Hace clic en "Descargar"
3. Aparece modal pidiendo email + consentimientos (reutiliza NewsletterForm)
4. Al suscribirse, se descarga el PDF automaticamente
5. El PDF se almacena en Supabase Storage (bucket publico)

### 3.2 Lead Magnets a crear (PDFs)

| Lead Magnet | URL | Disponible en |
|-------------|-----|---------------|
| Calendario Editorial 2026 (Generico) | `/recursos` | /recursos, footer |
| Calendario Editorial - Clinicas | `/recursos?sector=clinicas` | /para/clinicas |
| Calendario Editorial - Agencias | `/recursos?sector=agencias` | /para/agencias-marketing |
| Calendario Editorial - Ecommerce | `/recursos?sector=ecommerce` | /para/tiendas-online |
| Calendario Editorial - Autonomos | `/recursos?sector=autonomos` | /para/autonomos |
| 50 Ideas de Posts (Generico) | `/recursos` | /recursos |
| 50 Ideas - Clinicas | `/recursos` | /para/clinicas |
| 50 Ideas - Agencias | `/recursos` | /para/agencias-marketing |
| 50 Ideas - Ecommerce | `/recursos` | /para/tiendas-online |
| 50 Ideas - Autonomos | `/recursos` | /para/autonomos |
| Checklist SEO On-Page | `/recursos` | /recursos, blog |
| Plantilla Tareas Redactor | `/recursos` | /recursos |

**Total**: 12 PDFs (4 calendarios + 1 generico, 4 ideas + 1 generico, 2 herramientas)

### 3.3 Componentes a crear

**Nuevos archivos**:
```text
src/components/marketing/LeadMagnetCard.tsx      # Card para mostrar cada recurso
src/components/marketing/LeadMagnetModal.tsx     # Modal de captura de email
src/hooks/useLeadMagnetDownload.ts               # Hook para gestionar descarga
```

**Archivos a modificar**:
```text
src/pages/Resources.tsx                          # Reorganizar con lead magnets
src/pages/usecases/Clinicas.tsx                  # Anadir lead magnet especifico
src/pages/usecases/Agencias.tsx                  # Anadir lead magnet especifico
src/pages/usecases/Ecommerce.tsx                 # Anadir lead magnet especifico
src/pages/usecases/Autonomos.tsx                 # Anadir lead magnet especifico
```

### 3.4 Estructura del componente LeadMagnetCard

```typescript
interface LeadMagnetCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  type: 'PDF' | 'Checklist' | 'Plantilla';
  sector?: 'clinicas' | 'agencias' | 'ecommerce' | 'autonomos' | 'general';
  downloadUrl: string; // URL del PDF en storage
}
```

### 3.5 Estructura del modal de descarga

El modal reutilizara la logica de NewsletterForm pero:
- Al completar suscripcion, iniciara descarga automatica del PDF
- Guardara en la tabla `newsletter_subscribers` el `source` indicando que lead magnet descargo
- Mostrara mensaje de exito + descarga

### 3.6 Plantilla de Tareas para Redactar (contenido especial)

Este PDF es estrategico porque muestra:

**Tareas manuales vs Blooglee**

| Tarea | Manual | Con Blooglee |
|-------|--------|--------------|
| Investigar tema | 30 min | Automatico |
| Escribir borrador | 2-3 horas | 60 segundos |
| Revisar SEO | 20 min | Automatico |
| Buscar imagen | 15 min | Incluida |
| Subir a WordPress | 10 min | 1 clic |
| **TOTAL** | **3-4 horas** | **2 minutos** |

Este PDF funcionara como pieza de conversion directa a trial.

---

## Seccion Tecnica: Orden de Implementacion

### Paso 1: Actualizar footer con nuevos enlaces
- Modificar `PublicFooter.tsx` con secciones Soluciones y Recursos

### Paso 2: Cambiar autor del blog
- Modificar edge function `generate-blog-blooglee`
- Ejecutar UPDATE SQL para posts existentes

### Paso 3: Crear sistema de lead magnets
- Crear bucket de storage para PDFs
- Crear componentes LeadMagnetCard y LeadMagnetModal
- Crear hook useLeadMagnetDownload
- Actualizar pagina Resources.tsx

### Paso 4: Generar contenido de PDFs
- Crear PDFs con contenido de valor real
- Subir a Supabase Storage
- Configurar URLs en los componentes

### Paso 5: Integrar lead magnets en paginas de sector
- Anadir seccion de lead magnet especifico en cada pagina de caso de uso

---

## Archivos a crear

| Archivo | Descripcion |
|---------|-------------|
| `src/components/marketing/LeadMagnetCard.tsx` | Tarjeta de recurso descargable |
| `src/components/marketing/LeadMagnetModal.tsx` | Modal de captura de email |
| `src/hooks/useLeadMagnetDownload.ts` | Hook para descargas |

## Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/marketing/PublicFooter.tsx` | Nuevas secciones de enlaces |
| `supabase/functions/generate-blog-blooglee/index.ts` | Autor "Generado por Blooglee" |
| `src/pages/Resources.tsx` | Integracion de lead magnets |
| `src/pages/usecases/Clinicas.tsx` | Lead magnet especifico |
| `src/pages/usecases/Agencias.tsx` | Lead magnet especifico |
| `src/pages/usecases/Ecommerce.tsx` | Lead magnet especifico |
| `src/pages/usecases/Autonomos.tsx` | Lead magnet especifico |

---

## Resultado Final

Al completar este plan:
- **Footer enriquecido** con 4 secciones: Producto, Soluciones, Recursos, Legal
- **Autor del blog** actualizado a "Generado por Blooglee" (mas transparente y diferenciador)
- **12 Lead Magnets** descargables que capturan emails
- **Cada pagina de sector** tendra su propio calendario + ideas
- **Sistema de captura** integrado con newsletter existente
