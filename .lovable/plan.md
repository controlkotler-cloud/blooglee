

# Plan: Actualizar imagen de autor en blog posts + Diagnóstico Newsletter

## Resumen de hallazgos

| Aspecto | Estado actual | Accion requerida |
|---------|---------------|------------------|
| **author_name** | "Generado por Blooglee" | Ya correcto |
| **author_role** | "IA de Blooglee" | Ya correcto |
| **author_avatar** | Imagen de Unsplash (mujer) | Cambiar al logo de Blooglee |
| **Newsletter** | Funciona correctamente | Se envio 1 email a nuriafrancis@gmail.com al ejecutar manualmente |
| **Emails admin** | Configurado para control@mkpro.es, laura@mkpro.es | Funciona segun diseno |

---

## 1. Actualizar imagen de perfil del autor

### Problema
Los posts usan `author_avatar` con URL de Unsplash en lugar del logo de Blooglee:
```
https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100...
```

### Solucion

**Paso 1:** Subir el logo a Supabase Storage (bucket `article-images`) para tener URL publica permanente

**Paso 2:** Actualizar la Edge Function `generate-blog-blooglee/index.ts` para usar la URL del logo:
- Buscar donde se define `author_avatar`
- Cambiar la URL de Unsplash por la URL del logo en Storage

**Paso 3:** Actualizar los posts existentes en la base de datos:
```sql
UPDATE blog_posts 
SET author_avatar = 'https://gqtikajhhggyoiypkbgw.supabase.co/storage/v1/object/public/article-images/blooglee-avatar.png'
WHERE author_avatar LIKE '%unsplash%';
```

---

## 2. Diagnostico Newsletter - Ya funciona

Al ejecutar manualmente `send-newsletter`, confirmo que **SI funciona**:

```json
{
  "emailsSent": 1,
  "postsCount": 1,
  "subscribersCount": 1,
  "success": true
}
```

### Por que no recibias emails automaticamente

El flujo automatico es:
1. `generate-monthly-articles` (cron 09:00 UTC) genera posts del blog
2. Solo si genera posts nuevos (`blogGeneratedCount > 0`), llama a `send-newsletter`
3. `send-newsletter` busca posts publicados **HOY** y envia a suscriptores

**Hoy a las 09:00** se genero 1 post para empresas. Tu email (`nuriafrancis@gmail.com`) esta registrado como `empresas`. El newsletter deberia haberse enviado, pero al estar tu registrado despues de las 09:00 UTC (te suscribiste a las 10:39 UTC), no estabas en la lista cuando se ejecuto.

### Verificacion

Al ejecutar manualmente ahora, SI recibiste el email (1 email enviado).

**Accion:** Revisar tu bandeja de entrada/spam para el email de "Blooglee" con el articulo de hoy.

---

## 3. Email de administrador

Los emails de notificacion de generacion se envian a:
- `control@mkpro.es`
- `laura@mkpro.es`

Si quieres recibir estas notificaciones, puedo anadir tu email a la lista `NOTIFICATION_EMAILS` en `generate-monthly-articles/index.ts`.

---

## Seccion Tecnica

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/assets/blooglee-logo.png` | Copiar a Storage (usando herramienta) |
| `supabase/functions/generate-blog-blooglee/index.ts` | Cambiar URL de `author_avatar` al logo |
| Base de datos `blog_posts` | Ejecutar UPDATE para posts existentes |
| `supabase/functions/generate-monthly-articles/index.ts` (opcional) | Anadir email a NOTIFICATION_EMAILS |

### URL del logo tras subir a Storage

```
https://gqtikajhhggyoiypkbgw.supabase.co/storage/v1/object/public/article-images/blooglee-avatar.png
```

### Migracion SQL para posts existentes

```sql
UPDATE blog_posts 
SET author_avatar = 'https://gqtikajhhggyoiypkbgw.supabase.co/storage/v1/object/public/article-images/blooglee-avatar.png'
WHERE author_avatar LIKE '%unsplash%';
```

---

## Resultado esperado

1. **Posts del blog** mostraran el logo de Blooglee como avatar del autor
2. **Newsletter** ya funciona - verifica tu bandeja de entrada
3. **Futuros posts** usaran automaticamente el logo de Blooglee
4. **Emails admin** (opcional) pueden incluir tu email si lo deseas

