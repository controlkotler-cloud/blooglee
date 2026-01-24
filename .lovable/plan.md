

## Plan: Implementar SaaS Multi-tenant (Respetando MKPro)

### Resumen
Añadir capacidades SaaS multi-tenant al proyecto **sin tocar** los componentes, hooks ni tablas existentes de MKPro (farmacias/empresas). Todo el código nuevo irá en rutas y archivos separados.

---

### Fase 1: Migración de Base de Datos

**Nuevas tablas a crear:**

1. **profiles** - Perfiles de usuario con plan de suscripción
   - `id` (UUID, referencia a auth.users)
   - `email` (TEXT)
   - `plan` (TEXT: 'free', 'pro', 'agency')
   - `sites_limit` (INTEGER, default 1)
   - `is_mkpro_admin` (BOOLEAN, default false)
   - Trigger automático para crear perfil en cada registro

2. **sites** - Sitios genéricos multi-tenant
   - `id`, `user_id`, `name`, `sector`, `location`
   - `geographic_scope`, `languages`, `blog_url`, `instagram_url`
   - `auto_generate`, `custom_topic`

3. **articles** - Artículos SaaS con aislamiento por usuario
   - `id`, `site_id`, `user_id`, `month`, `year`, `topic`
   - `content_spanish`, `content_catalan`, `image_url`, etc.

4. **wordpress_configs** - Configuración WP multi-tenant
   - `id`, `site_id`, `user_id`, `site_url`, `wp_username`, `wp_app_password`

**RLS para todas las tablas nuevas:**
```sql
CREATE POLICY "Users CRUD own data" ON [tabla]
  FOR ALL USING (auth.uid() = user_id);
```

---

### Fase 2: Autenticación y Registro

**Actualizar Auth.tsx:**
- Añadir toggle entre Login y Registro (actualmente solo login)
- Mantener el diseño actual pero con opción de crear cuenta
- Configurar auto-confirm de emails en Supabase

**Lógica de redirección post-login:**
- Si `profile.is_mkpro_admin = true` → `/mkpro`
- Si usuario nuevo sin sites → `/onboarding`
- Si usuario normal con sites → `/`

---

### Fase 3: Nueva Página /onboarding

**Wizard de 4 pasos para nuevos usuarios:**

1. **Paso 1:** Nombre del sitio + Sector (select con opciones + "Otro")
2. **Paso 2:** Ubicación + Ámbito geográfico (local/regional/nacional)
3. **Paso 3:** Idiomas (español obligatorio, catalán opcional)
4. **Paso 4:** WordPress (opcional - URL, usuario, app password)

**Al finalizar:** Crear site en BD y redirigir a Dashboard

---

### Fase 4: Dashboard SaaS (ruta `/`)

**Nuevo componente:** `src/components/saas/SaasDashboard.tsx`

**Contenido:**
- Header con nombre del usuario y plan actual
- Lista de sites del usuario (cards)
- Indicador de límite: "1/1 sitios" (según plan)
- Botón "+ Añadir sitio" (deshabilitado si alcanzó límite)
- Por cada site: nombre, sector, último artículo, acciones

**Acciones por site:**
- Generar artículo
- Ver artículos
- Configurar WordPress
- Editar configuración

---

### Fase 5: Dashboard MKPro (ruta `/mkpro`)

**Mover el Index.tsx actual a:** `src/pages/MKPro.tsx`

- Accesible solo si `profile.is_mkpro_admin = true`
- Mantiene exactamente la funcionalidad actual (Farmacias + Empresas)
- Los hooks existentes (`useFarmacias`, `useEmpresas`) NO se modifican
- Las Edge Functions existentes NO se modifican

---

### Fase 6: Nuevos Hooks SaaS

**Crear en rutas separadas:**

- `src/hooks/useSites.ts` - CRUD de sites con `user_id = auth.uid()`
- `src/hooks/useArticlesSaas.ts` - Artículos por site_id
- `src/hooks/useProfile.ts` - Obtener/actualizar perfil y plan
- `src/hooks/useWordPressConfigSaas.ts` - Config WP por site

---

### Fase 7: Edge Functions SaaS (Futuro)

**Crear con sufijo `-saas`:**
- `generate-article-saas` - Usa tabla `sites` y `articles`
- `publish-to-wordpress-saas` - Usa `wordpress_configs`

**Las Edge Functions actuales NO se tocan.**

---

### Fase 8: Actualizar Rutas en App.tsx

```
/auth          → Auth (login + registro)
/onboarding    → Onboarding wizard (nuevos usuarios)
/              → SaasDashboard (usuarios normales)
/mkpro         → MKPro Dashboard (solo admins)
/site/:id      → Detalle de un site (futuro)
```

---

### Orden de Implementación

| Paso | Descripción | Riesgo |
|------|-------------|--------|
| 1 | Migración SQL (profiles, sites, articles, wordpress_configs) | Bajo |
| 2 | Actualizar Auth.tsx con registro | Bajo |
| 3 | Crear useProfile hook | Bajo |
| 4 | Actualizar ProtectedRoute con lógica de redirección | Medio |
| 5 | Crear página Onboarding | Bajo |
| 6 | Crear hooks SaaS (useSites, useArticlesSaas) | Bajo |
| 7 | Crear SaasDashboard | Bajo |
| 8 | Mover Index actual a /mkpro | Medio |
| 9 | Edge Functions -saas | Bajo |

---

### Archivos que se CREARÁN (nuevos)

```
src/pages/Onboarding.tsx
src/pages/SaasDashboard.tsx
src/pages/MKPro.tsx (copia de Index.tsx actual)
src/hooks/useProfile.ts
src/hooks/useSites.ts
src/hooks/useArticlesSaas.ts
src/hooks/useWordPressConfigSaas.ts
src/components/saas/SiteCard.tsx
src/components/saas/OnboardingWizard.tsx
supabase/functions/generate-article-saas/
supabase/functions/publish-to-wordpress-saas/
```

### Archivos que se MODIFICARÁN (mínimo)

```
src/App.tsx (añadir rutas)
src/pages/Auth.tsx (añadir registro)
src/components/ProtectedRoute.tsx (lógica de redirección)
```

### Archivos PROTEGIDOS (NO tocar)

```
src/components/pharmacy/* (todos)
src/components/company/* (todos)
src/hooks/useFarmacias.ts
src/hooks/useArticulos.ts
src/hooks/useEmpresas.ts
src/hooks/useWordPressSites.ts
supabase/functions/generate-article/
supabase/functions/publish-to-wordpress/
(y demás Edge Functions existentes)
```

