

## Plan: Desplegar sync-wordpress-taxonomies-saas y documentar memoria

### Problema detectado

| Síntoma | Causa raíz |
|---------|------------|
| "Failed to send request to Edge Function" al sincronizar | La función `sync-wordpress-taxonomies-saas` no está desplegada |
| No hay logs en la función | Nunca se desplegó tras cambios recientes |

### Solución

La función `sync-wordpress-taxonomies-saas` ya existe en el código y está registrada en `config.toml`, pero necesita ser desplegada para que funcione.

**Acción:** Desplegar la edge function `sync-wordpress-taxonomies-saas`

---

### Respuesta a tu pregunta: ¿Cómo queda en memoria cada post nuevo?

El sistema mantiene automáticamente el contexto de WordPress (`wordpress_context`) de dos formas:

#### 1. Al SINCRONIZAR (botón "Sincronizar")
Se hace un análisis completo del blog WordPress:
- Descarga los últimos 15 posts publicados
- Extrae los títulos → `lastTopics` (máximo 10)
- Calcula longitud promedio → `avgLength`
- Cuenta categorías más usadas → `commonCategories`
- Analiza tono con IA → `detected_tone`, `main_themes`, `style_notes`
- Guarda timestamp → `analyzed_at`

Este proceso **SOBRESCRIBE** todo el contexto anterior.

#### 2. Al PUBLICAR (cada nuevo post)
Cuando publicas un artículo con `publish-to-wordpress-saas`:
- Obtiene el contexto actual del site
- Añade el nuevo título al INICIO del array `lastTopics`
- Limita a 25 elementos máximo
- Añade `last_publish_at` con la fecha
- **PRESERVA** el resto del contexto (tono, categorías, etc.)

```javascript
// Líneas 311-320 de publish-to-wordpress-saas
const updatedTopics = [body.title, ...currentTopics].slice(0, 25);
wordpress_context: {
  ...currentContext,           // Mantiene avgLength, commonCategories, etc.
  lastTopics: updatedTopics,   // Nuevo array con título añadido
  last_publish_at: new Date().toISOString()
}
```

#### Flujo recomendado

```text
1. Conectar WordPress → Sincronizar (análisis completo)
2. Publicar posts → Se auto-actualiza lastTopics
3. Sincronizar de nuevo → Solo si cambiaste mucho el blog manualmente
```

---

### Archivos afectados

| Archivo | Estado |
|---------|--------|
| `supabase/functions/sync-wordpress-taxonomies-saas/index.ts` | Ya existe, solo necesita despliegue |

### Acción inmediata

Desplegar la función para resolver el error.

