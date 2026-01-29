

# Plan: Integrar Health Check en el Flujo de Configuracion WordPress

## Problema Detectado

El formulario `WordPressConfigForm.tsx` tiene toda la ayuda contextual implementada correctamente, **pero le falta la funcionalidad principal**:

1. **No ejecuta validacion al introducir la URL** - Deberia verificar que el WordPress es accesible (Fase 1)
2. **No ejecuta health check al guardar** - Deberia validar credenciales antes de guardar (Fase 2-3)
3. **El componente `WordPressHealthCheck` existe pero no esta usado** - Esta en `src/components/saas/WordPressHealthCheck.tsx`

## Flujo Propuesto

```text
┌─────────────────────────────────────────────────────────────────┐
│  PASO 1: Usuario introduce URL                                  │
│  → Al perder el foco (onBlur), ejecutar Fase 1 del health check│
│  → Mostrar indicador: "Verificando sitio..."                    │
│  → Si OK: icono verde + "Sitio WordPress detectado"             │
│  → Si ERROR: mensaje de error inline                            │
├─────────────────────────────────────────────────────────────────┤
│  PASO 2: Usuario introduce credenciales                         │
│  → Sin validacion hasta guardar (no queremos spam de requests) │
├─────────────────────────────────────────────────────────────────┤
│  PASO 3: Usuario hace clic en "Guardar"                         │
│  → Ejecutar Fase 3 completa ANTES de guardar en DB              │
│  → Mostrar resultados del diagnostico                           │
│  → Si TODO OK: guardar y mostrar exito                          │
│  → Si HAY ERRORES: mostrar errores, NO guardar                  │
│  → Si HAY WARNINGS: mostrar warnings, preguntar si continuar    │
└─────────────────────────────────────────────────────────────────┘
```

## Cambios Tecnicos

### Archivo: `src/components/saas/WordPressConfigForm.tsx`

1. **Importar el hook de health check**
```typescript
import { useWordPressHealthCheck } from '@/hooks/useWordPressHealthCheck';
```

2. **Anadir estado para validacion de URL**
```typescript
const [urlStatus, setUrlStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
const [urlError, setUrlError] = useState<string | null>(null);
const { runHealthCheck, isChecking } = useWordPressHealthCheck();
```

3. **Validar URL al perder foco**
```typescript
const handleUrlBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
  const url = e.target.value;
  if (!url || urlStatus === 'checking') return;
  
  setUrlStatus('checking');
  setUrlError(null);
  
  const result = await runHealthCheck(url, undefined, undefined, 1);
  
  if (result?.overall_status === 'success' || result?.overall_status === 'warning') {
    setUrlStatus('valid');
  } else {
    setUrlStatus('invalid');
    setUrlError(result?.errors?.[0] || 'No se pudo conectar con el sitio');
  }
};
```

4. **Validar credenciales completas antes de guardar**
```typescript
const onSubmit = async (data: FormData) => {
  // Ejecutar health check completo (fase 3)
  setValidationState('validating');
  
  const result = await runHealthCheck(
    data.site_url,
    data.wp_username,
    data.wp_app_password,
    3 // Fase completa
  );
  
  if (result?.overall_status === 'error') {
    // Mostrar errores, NO guardar
    setValidationState('error');
    setValidationResult(result);
    return;
  }
  
  // Todo OK o solo warnings, proceder a guardar
  upsertMutation.mutate({
    site_id: siteId,
    site_url: data.site_url,
    wp_username: data.wp_username,
    wp_app_password: data.wp_app_password,
  });
  
  setValidationState('success');
  setValidationResult(result);
};
```

5. **UI para mostrar estado de validacion**
```typescript
// Indicador junto al input de URL
{urlStatus === 'checking' && (
  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
)}
{urlStatus === 'valid' && (
  <CheckCircle className="w-4 h-4 text-green-500" />
)}
{urlStatus === 'invalid' && (
  <XCircle className="w-4 h-4 text-red-500" />
)}

// Panel de resultados despues de guardar
{validationResult && (
  <div className="mt-4 p-4 rounded-lg bg-muted">
    <h4 className="font-medium mb-2">Resultado del diagnostico</h4>
    {validationResult.checks.map(check => (
      <div key={check.id} className="flex items-center gap-2">
        {/* Iconos segun status */}
        <span>{check.message}</span>
      </div>
    ))}
  </div>
)}
```

## Estados de la UI

| Estado | Comportamiento |
|--------|----------------|
| `idle` | Formulario normal, sin validacion activa |
| `checking_url` | Spinner en campo URL mientras valida |
| `url_valid` | Check verde junto a URL |
| `url_invalid` | X roja + mensaje de error |
| `validating` | Boton deshabilitado + "Verificando conexion..." |
| `validation_error` | Panel rojo con errores, boton de reintentar |
| `validation_warning` | Panel amarillo con warnings, opcion de continuar |
| `success` | Panel verde, config guardada |

## Resultado Esperado

1. **Al introducir URL**: El usuario ve inmediatamente si su WordPress es accesible
2. **Al guardar**: Se validan las credenciales ANTES de guardar
3. **Feedback claro**: Si algo falla, el usuario sabe exactamente que corregir
4. **No se guardan configs invalidas**: Solo se persiste si la conexion funciona

## Archivos a Modificar

- `src/components/saas/WordPressConfigForm.tsx`

## Seccion Tecnica Detallada

### Nuevos Estados

```typescript
const [urlStatus, setUrlStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
const [urlError, setUrlError] = useState<string | null>(null);
const [validationState, setValidationState] = useState<'idle' | 'validating' | 'error' | 'warning' | 'success'>('idle');
const [validationResult, setValidationResult] = useState<HealthCheckResult | null>(null);

const { runHealthCheck, isChecking } = useWordPressHealthCheck();
```

### Logica de Submit Actualizada

```typescript
const onSubmit = async (data: FormData) => {
  setValidationState('validating');
  setValidationResult(null);

  try {
    // Ejecutar health check fase 3 (completo con credenciales)
    const result = await runHealthCheck(
      data.site_url,
      data.wp_username,
      data.wp_app_password,
      3
    );

    setValidationResult(result);

    if (!result) {
      setValidationState('error');
      toast.error('Error al verificar la conexion');
      return;
    }

    if (result.overall_status === 'error') {
      setValidationState('error');
      toast.error('Hay problemas con la configuracion');
      return;
    }

    // Success o warning - guardar config
    await upsertMutation.mutateAsync({
      site_id: siteId,
      site_url: data.site_url,
      wp_username: data.wp_username,
      wp_app_password: data.wp_app_password,
    });

    setValidationState('success');
    
  } catch (error) {
    console.error('Error:', error);
    setValidationState('error');
  }
};
```

### Imports Adicionales

```typescript
import { useWordPressHealthCheck, HealthCheckResult } from '@/hooks/useWordPressHealthCheck';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
```

