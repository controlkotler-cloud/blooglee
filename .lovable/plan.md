
# Plan: Experiencia de Onboarding Revolucionaria con Guía Interactiva

## El Problema Actual

1. **Onboarding aburrido**: Un formulario de 4 pasos sin vida, sin feedback visual
2. **WordPress es "opcional" pero no lo es**: Se puede generar artículo sin WP configurado y falla
3. **Sin guía post-onboarding**: El usuario termina en el dashboard y no sabe qué hacer
4. **Sin validaciones inteligentes**: El botón "Generar" está habilitado aunque falte WordPress

## La Visión Revolucionaria

Una experiencia de onboarding en **2 fases**:

```text
┌─────────────────────────────────────────────────────────────────┐
│                     FASE 1: WIZARD RÁPIDO                       │
│                    (Solo lo esencial)                           │
├─────────────────────────────────────────────────────────────────┤
│   Paso 1: Nombre + Sector                                       │
│   Paso 2: Ubicación + Ámbito (opcional rápido)                  │
│   Paso 3: Frecuencia + Idiomas                                  │
│                                                                  │
│   → Finaliza en < 2 minutos                                     │
│   → WordPress NO se pide aquí                                   │
│   → El usuario llega al Dashboard con su sitio creado           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              FASE 2: GUÍA INTERACTIVA OVERLAY                   │
│                (Spotlight paso a paso)                          │
├─────────────────────────────────────────────────────────────────┤
│   El usuario ve el Dashboard real PERO con overlay oscuro       │
│   y spotlight/foco en elementos específicos:                    │
│                                                                  │
│   Paso 1: "Este es tu sitio" → resalta SiteCard                 │
│   Paso 2: "Primero configura WordPress" → resalta botón WP      │
│   Paso 3: (Tras configurar WP) "Ahora genera tu primer post"    │
│   Paso 4: "Aquí verás tus artículos" → resalta Ver artículos    │
│                                                                  │
│   → Guía visual sobre la UI real                                │
│   → NO puede generar hasta configurar WordPress                 │
│   → Experiencia "wow" que el usuario recuerda                   │
└─────────────────────────────────────────────────────────────────┘
```

## Implementación Técnica

### Nueva Dependencia
```bash
npm install driver.js
```

**Por qué Driver.js:**
- 6kb gzipped (super ligero)
- Sin dependencias React específicas
- Overlay con spotlight animado
- Progreso visual entre pasos
- Personalización completa del estilo

### Nuevos Archivos

| Archivo | Propósito |
|---------|-----------|
| `src/components/saas/OnboardingTour.tsx` | Componente de guía interactiva con Driver.js |
| `src/hooks/useOnboardingTour.ts` | Hook para controlar estado del tour y persistencia |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Onboarding.tsx` | Simplificar a 3 pasos (eliminar WordPress del wizard) |
| `src/pages/SaasDashboard.tsx` | Integrar OnboardingTour para nuevos usuarios |
| `src/pages/SiteDetail.tsx` | Bloquear generación sin WordPress + trigger tour |
| `src/components/saas/SiteCard.tsx` | Añadir data-tour-id para spotlight + deshabilitar sin WP |
| Base de datos | Añadir campo `onboarding_completed` a `profiles` |

## Flujo Detallado

### Fase 1: Nuevo Onboarding (3 pasos)

**Paso 1: Tu Negocio**
- Nombre del sitio (obligatorio)
- Sector (selector visual con iconos)
- Descripción breve (opcional)

**Paso 2: Ubicación**
- Ciudad/Región
- Ámbito geográfico (tarjetas visuales clickables)

**Paso 3: Preferencias**
- Frecuencia de publicación (selector visual)
- Idiomas (checkboxes estilizados)

**Sin Paso 4 de WordPress** - Se configura después con guía.

### Fase 2: Tour Interactivo en Dashboard

```typescript
// src/components/saas/OnboardingTour.tsx
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const tourSteps = [
  {
    element: '[data-tour="welcome"]',
    popover: {
      title: "Bienvenido a Blooglee",
      description: "Tu sitio está listo. Te guío para generar tu primer artículo.",
      side: "bottom"
    }
  },
  {
    element: '[data-tour="site-card"]',
    popover: {
      title: "Este es tu sitio",
      description: "Aquí verás el resumen de tu sitio y sus artículos.",
      side: "bottom"
    }
  },
  {
    element: '[data-tour="wordpress-config"]',
    popover: {
      title: "Configura WordPress primero",
      description: "Para publicar artículos, necesitas conectar tu WordPress. Haz clic aquí.",
      side: "left"
    }
  },
  // Paso condicional: tras configurar WP
  {
    element: '[data-tour="generate-button"]',
    popover: {
      title: "Genera tu primer artículo",
      description: "Con WordPress conectado, ya puedes generar contenido automático.",
      side: "bottom"
    }
  }
];
```

### Bloqueo Inteligente de Generación

```typescript
// En SiteCard.tsx y SiteDetail.tsx
const canGenerate = !!wpConfig;

<Button 
  onClick={canGenerate ? onGenerateArticle : onConfigureWordPress}
  disabled={isGenerating}
  data-tour="generate-button"
>
  {!canGenerate && <Lock className="w-4 h-4 mr-2" />}
  {isGenerating ? 'Generando...' : canGenerate ? 'Generar' : 'Configura WP primero'}
</Button>
```

### Persistencia del Estado del Tour

```sql
-- Migración: añadir columna a profiles
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
```

```typescript
// useOnboardingTour.ts
export function useOnboardingTour() {
  const { data: profile } = useProfile();
  const [tourStep, setTourStep] = useState(0);
  
  const shouldShowTour = !profile?.onboarding_completed;
  
  const completeTour = async () => {
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id);
  };
  
  return { shouldShowTour, tourStep, setTourStep, completeTour };
}
```

## Diseño Visual del Tour

El overlay de Driver.js se personalizará con los colores de Blooglee:

```css
/* Estilos personalizados */
.driver-popover {
  background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.4);
}

.driver-popover-title {
  font-family: 'Sora', sans-serif;
  font-size: 1.25rem;
}

.driver-popover-description {
  font-family: 'Inter', sans-serif;
}

.driver-popover-progress-text {
  color: rgba(255,255,255,0.7);
}

/* Spotlight con borde gradiente */
.driver-active-element {
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.5),
              0 0 0 8px rgba(217, 70, 239, 0.3);
}
```

## Resumen de Cambios

| Tipo | Archivo/Recurso | Acción |
|------|-----------------|--------|
| Dependencia | `driver.js` | Instalar |
| Componente | `OnboardingTour.tsx` | Crear |
| Hook | `useOnboardingTour.ts` | Crear |
| Página | `Onboarding.tsx` | Simplificar a 3 pasos |
| Página | `SaasDashboard.tsx` | Integrar tour + pasar wpConfigs |
| Página | `SiteDetail.tsx` | Bloquear generación sin WP |
| Componente | `SiteCard.tsx` | data-tour IDs + lógica WP |
| CSS | `driver-custom.css` | Estilos Blooglee |
| BD | `profiles` | Añadir `onboarding_completed` |

## Resultado Esperado

1. **Usuario nuevo se registra** → Va a Onboarding de 3 pasos (< 2 min)
2. **Termina onboarding** → Llega al Dashboard con tour activo
3. **Tour le guía visualmente** → Spotlight en cada elemento importante
4. **Intenta generar sin WP** → El botón le lleva a configurar WP primero
5. **Configura WordPress** → El tour avanza al siguiente paso
6. **Genera su primer artículo** → Tour se completa, marca en BD
7. **Futuras visitas** → No muestra tour, experiencia normal

Esta experiencia es:
- **Sencilla**: Solo 3 pasos iniciales
- **Clara**: Guía visual sobre la UI real
- **Limpia**: Overlay elegante con diseño Blooglee
- **Rápida**: < 5 minutos hasta el primer artículo
- **Inteligente**: Bloquea acciones hasta que tengan sentido

---

## Sección Tecnica Detallada

### Estructura del OnboardingTour

```typescript
// src/components/saas/OnboardingTour.tsx
interface OnboardingTourProps {
  isFirstSite: boolean;
  hasWordPressConfigured: boolean;
  onComplete: () => void;
}

export function OnboardingTour({ 
  isFirstSite, 
  hasWordPressConfigured, 
  onComplete 
}: OnboardingTourProps) {
  useEffect(() => {
    if (!isFirstSite) return;
    
    const driverObj = driver({
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Empezar a crear',
      popoverClass: 'blooglee-tour-popover',
      onDestroyStarted: () => {
        onComplete();
        driverObj.destroy();
      },
      steps: getTourSteps(hasWordPressConfigured)
    });
    
    driverObj.drive();
    
    return () => driverObj.destroy();
  }, [isFirstSite, hasWordPressConfigured]);
  
  return null; // No renderiza nada, solo controla el tour
}
```

### Integración con SaasDashboard

```typescript
// En SaasDashboard.tsx
const { shouldShowTour, completeTour } = useOnboardingTour();
const wpConfigsQuery = useWordPressConfigsBatch(sites.map(s => s.id));

return (
  <div>
    {shouldShowTour && sites.length > 0 && (
      <OnboardingTour
        isFirstSite={true}
        hasWordPressConfigured={!!wpConfigsQuery.data?.[sites[0]?.id]}
        onComplete={completeTour}
      />
    )}
    
    {/* Resto del dashboard con data-tour attributes */}
    <div data-tour="welcome">
      <BloogleeLogo />
    </div>
    
    {sites.map(site => (
      <div data-tour={site === sites[0] ? "site-card" : undefined}>
        <SiteCard ... />
      </div>
    ))}
  </div>
);
```

### Hook para cargar WordPress configs en batch

```typescript
// useWordPressConfigSaas.ts - añadir
export function useWordPressConfigsBatch(siteIds: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['wordpress_configs', 'batch', siteIds],
    queryFn: async () => {
      if (!user?.id || siteIds.length === 0) return {};
      
      const { data } = await supabase
        .from('wordpress_configs')
        .select('*')
        .in('site_id', siteIds)
        .eq('user_id', user.id);
      
      // Retornar como mapa: { siteId: config }
      return (data || []).reduce((acc, cfg) => {
        acc[cfg.site_id] = cfg;
        return acc;
      }, {} as Record<string, WordPressConfig>);
    },
    enabled: !!user?.id && siteIds.length > 0
  });
}
```

### Migración de Base de Datos

```sql
-- Añadir campo para tracking del onboarding
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Marcar usuarios existentes como completados
UPDATE profiles SET onboarding_completed = TRUE WHERE user_id IN (
  SELECT DISTINCT user_id FROM sites
);
```
