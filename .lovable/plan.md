

## Plan: Limpieza y Optimizacion del Proyecto

### 1. Limpiar plan.md

El archivo `.lovable/plan.md` contiene el plan del fix de markdown que ya fue implementado. Se limpiara dejando solo documentacion de referencia minima.

**Cambio:**
```markdown
# Blooglee - Notas de implementacion

Este archivo se usa para planes temporales durante el desarrollo.
Actualmente no hay planes pendientes.
```

---

### 2. Optimizacion de Base de Datos

#### A. Indices faltantes en tabla `articles`

La tabla `articles` solo tiene indice en `id` pero las consultas frecuentes filtran por `site_id`, `user_id`, `month` y `year`.

**Indices a crear:**
```sql
-- Indice compuesto para consultas por site + usuario
CREATE INDEX IF NOT EXISTS idx_articles_site_user 
ON public.articles(site_id, user_id);

-- Indice para consultas por mes/ano
CREATE INDEX IF NOT EXISTS idx_articles_month_year 
ON public.articles(month, year);

-- Indice para ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_articles_generated_at 
ON public.articles(generated_at DESC);
```

#### B. Indices faltantes en tabla `sites`

```sql
-- Indice para consultas por usuario
CREATE INDEX IF NOT EXISTS idx_sites_user_id 
ON public.sites(user_id);
```

---

### 3. Politicas RLS con `true` (NO MODIFICAR)

El linter detecta 10 politicas con `USING (true)` en:
- `farmacias`
- `articulos`
- `empresas`
- `articulos_empresas`
- `wordpress_sites`
- `wordpress_site_default_taxonomies`

Segun las reglas de arquitectura del proyecto, estas son tablas del sistema **MKPro legacy** que operan sin `user_id` y son INTENCIONALES. **NO SE MODIFICAN** para mantener compatibilidad con el panel de administracion MKPro.

---

### 4. Codigo duplicado (Aceptable)

La funcion `cleanMarkdownFromHtml()` esta duplicada en 3 edge functions:
- `generate-article-saas/index.ts`
- `generate-article/index.ts`
- `generate-article-empresa/index.ts`

**Evaluacion:** En Deno edge functions, no es posible compartir codigo facilmente entre funciones sin crear un modulo externo. Mantener la duplicacion es aceptable en este caso ya que:
- Son funciones aisladas
- El codigo es pequeno (~15 lineas)
- Modificar una no afecta a las otras

**Decision:** No se consolida.

---

### 5. Tablas vacias (Informativo)

Hay tablas con 0 registros:
- `survey_responses`
- `pending_surveys`
- `support_messages`
- `support_conversations`

Estas son funcionalidades preparadas para futuro uso (encuestas y soporte). **No se eliminan** porque la estructura ya existe y puede usarse cuando se necesite.

---

### Resumen de cambios

| Componente | Accion | Motivo |
|------------|--------|--------|
| `.lovable/plan.md` | Limpiar contenido | Plan implementado, ya no necesario |
| `articles` table | Agregar 3 indices | Mejorar rendimiento de consultas |
| `sites` table | Agregar 1 indice | Mejorar rendimiento de consultas |
| Politicas RLS MKPro | NO TOCAR | Intencional segun arquitectura |
| Codigo duplicado | NO TOCAR | Aceptable en edge functions |
| Tablas vacias | NO ELIMINAR | Preparadas para futuro uso |

---

### Resultado esperado

- Archivo plan.md limpio y listo para proximos planes
- Consultas a `articles` y `sites` mas rapidas con indices optimizados
- Codigo y estructura de base de datos sin cambios innecesarios
- Sistema mas organizado sin eliminar funcionalidad

