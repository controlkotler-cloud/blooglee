
# Plan: Corregir límites de sitios y mejorar ayuda en WordPress

## Problemas detectados

| Problema | Causa | Impacto |
|----------|-------|---------|
| Usuario beta muestra "2/1 sitios" | El Onboarding no valida el límite antes de crear | Usuarios pueden crear más sitios de los permitidos |
| No hay ayuda visible en WordPress | El formulario solo tiene guía básica, sin enlace a soluciones | Usuarios se quedan atascados con problemas de Wordfence, idiomas, etc. |
| Snippets de código no accesibles | Existen en `/data/codeSnippets.ts` pero no hay enlace desde WordPress | Usuarios no saben que hay soluciones disponibles |

## Solución propuesta

### Parte 1: Validar límite de sitios en Onboarding

Añadir validación al inicio de `Onboarding.tsx`:

```typescript
const { data: profile } = useProfile();
const { data: sites = [] } = useSites();

// Si ya alcanzó el límite, redirigir
useEffect(() => {
  if (profile && sites.length >= profile.sites_limit) {
    toast.error('Has alcanzado el límite de sitios de tu plan');
    navigate('/dashboard');
  }
}, [profile, sites]);
```

### Parte 2: Añadir sección de ayuda visible en WordPress

Añadir un panel destacado en `WordPressConfigForm.tsx` con:

1. **Enlace a "¿Problemas de conexión?"** que abre una sección de soluciones
2. **Snippets rápidos** para los problemas más comunes:
   - Wordfence bloquea la API
   - Polylang/WPML para multiidioma
   - Contraseñas de aplicación no disponibles
3. **Botón para abrir Bloobot** directamente desde WordPress

Diseño propuesto:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ ¿Problemas conectando WordPress?                     │
│                                                         │
│ Estos son los problemas más comunes:                   │
│                                                         │
│ 🛡️ Wordfence/Seguridad    → Ver solución              │
│ 🌐 Polylang/WPML          → Ver solución              │
│ 🔑 Sin contraseñas de app → Ver solución              │
│                                                         │
│ [💬 Hablar con Bloobot]  [📚 Ver más soluciones]       │
└─────────────────────────────────────────────────────────┘
```

### Parte 3: Eliminar el sitio extra del usuario beta

El usuario `controlkotler@gmail.com` tiene 2 sitios ("fisiolleida" y "farmacia 1") pero el límite es 1. Hay que notificar al usuario o eliminar el sitio extra.

**Opción recomendada**: No eliminar automáticamente - añadir un aviso en el dashboard cuando se excede el límite para que el usuario elija qué sitio mantener.

## Cambios técnicos

### Archivo: `src/pages/Onboarding.tsx`

**Añadir validación de límite al inicio:**

```typescript
import { useProfile } from '@/hooks/useProfile';
import { useSites } from '@/hooks/useSites';

// Dentro del componente:
const { data: profile } = useProfile();
const { data: existingSites = [] } = useSites();

useEffect(() => {
  if (profile && existingSites.length >= profile.sites_limit) {
    toast.error(`Has alcanzado el límite de ${profile.sites_limit} sitio(s) de tu plan`);
    navigate('/dashboard');
  }
}, [profile, existingSites, navigate]);
```

### Archivo: `src/components/saas/WordPressConfigForm.tsx`

**Añadir sección de ayuda expandida después del formulario:**

```typescript
// Nueva sección después del formulario de configuración
<Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
  <CardHeader className="pb-3">
    <CardTitle className="text-base flex items-center gap-2">
      <AlertTriangle className="w-5 h-5 text-amber-500" />
      ¿Problemas conectando WordPress?
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Los plugins de seguridad pueden bloquear la conexión. Aquí tienes soluciones:
    </p>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <TroubleshootButton 
        icon={Shield}
        title="Wordfence bloquea"
        description="Añadir excepciones al firewall"
        snippetId="wordfence-whitelist"
      />
      <TroubleshootButton 
        icon={Globe}
        title="Polylang/WPML"
        description="Soporte API para idiomas"
        snippetId="polylang-api-support"
      />
      <TroubleshootButton 
        icon={Key}
        title="Sin contraseñas de app"
        description="Habilitar en wp-config.php"
        snippetId="force-app-passwords"
      />
      <TroubleshootButton 
        icon={Shield}
        title="iThemes Security"
        description="Reactivar API REST"
        snippetId="ithemes-api-enable"
      />
    </div>
    
    <div className="flex gap-2 pt-2">
      <Button variant="outline" onClick={openBloobot}>
        <MessageSquare className="w-4 h-4 mr-2" />
        Hablar con Bloobot
      </Button>
      <Button variant="ghost" onClick={() => navigate('/help')}>
        <HelpCircle className="w-4 h-4 mr-2" />
        Centro de ayuda
      </Button>
    </div>
  </CardContent>
</Card>
```

**Añadir modal de snippet:**

Crear un componente `SnippetModal` que muestre el código del snippet seleccionado con botón de copiar.

### Archivo: `src/pages/SiteDetail.tsx`

Añadir el widget de Bloobot en la página de detalle del sitio:

```typescript
import { SupportChatWidget } from '@/components/saas/SupportChatWidget';

// En el return, al final:
<SupportChatWidget siteId={site.id} />
```

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Onboarding.tsx` | Validar límite de sitios antes de permitir crear |
| `src/components/saas/WordPressConfigForm.tsx` | Añadir panel de ayuda con soluciones rápidas |
| `src/pages/SiteDetail.tsx` | Añadir widget de Bloobot |
| `src/components/saas/TroubleshootPanel.tsx` | CREAR - Panel reutilizable de soluciones |

## Resultado esperado

1. Los usuarios NO pueden crear más sitios de los permitidos por su plan
2. Cuando hay problemas con WordPress, las soluciones están visibles
3. Los snippets de código son accesibles desde el formulario de WordPress
4. Bloobot está disponible directamente en la página del sitio
