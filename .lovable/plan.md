
# Plan: Corregir Bugs de Onboarding y Optimizar WordPress para Móvil

## Problema 1: Redirección Inesperada al Onboarding

### Causa Raíz
Cuando creas un sitio en el onboarding, el flujo es:
1. `createSite.mutateAsync()` crea el sitio en la base de datos
2. `invalidateQueries(['sites'])` se dispara pero es asincrono
3. `navigate('/dashboard')` ejecuta inmediatamente
4. En el dashboard, `ProtectedRoute` lee `sites` que aun tiene el cache antiguo (vacío)
5. `sites?.length === 0` devuelve `true` y te redirige de vuelta a `/onboarding`

### Solucion
Modificar `Onboarding.tsx` para esperar a que el cache se actualice antes de navegar:

```typescript
// En handleFinish()
const newSite = await createSite.mutateAsync({...});

// Esperar a que la invalidación se complete
await queryClient.refetchQueries({ queryKey: ['sites'] });

// Ahora sí navegar
navigate('/dashboard');
```

### Archivo a modificar
- `src/pages/Onboarding.tsx`

---

## Problema 2: WordPress Form No Optimizado para Movil

### Problemas Detectados
1. Inputs demasiado pequeños para touch (altura 40px, debería ser 48-52px)
2. Botones pegados sin espacio suficiente
3. El enlace de ayuda se corta en pantallas pequeñas
4. El botón "Mostrar/Ocultar" contraseña es muy pequeño
5. Los botones de acción (Guardar/Desconectar) no apilan en móvil

### Solucion
Crear un layout mobile-first con:
- Inputs más altos (h-12 en móvil)
- Botones que se apilan verticalmente en móvil
- Mejor espaciado entre elementos
- Enlace de ayuda que fluye mejor

### Cambios en WordPressConfigForm.tsx

```tsx
// Inputs más grandes
<Input className="h-12 text-base" ... />

// Botones que se apilan en móvil
<div className="flex flex-col sm:flex-row gap-3 pt-4">
  <Button className="w-full sm:w-auto" ...>Guardar</Button>
  <Button className="w-full sm:w-auto" ...>Desconectar</Button>
</div>

// Enlace de ayuda mejor formateado
<CardDescription className="space-y-1">
  <span>Conecta tu sitio WordPress para publicar artículos.</span>
  <a className="block sm:inline mt-1 sm:mt-0 sm:ml-1" ...>
    ¿Cómo crear una contraseña de aplicación?
  </a>
</CardDescription>
```

### Archivo a modificar
- `src/components/saas/WordPressConfigForm.tsx`

---

## Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| `src/pages/Onboarding.tsx` | Esperar refetch de sites antes de navegar |
| `src/components/saas/WordPressConfigForm.tsx` | Optimizar layout para móvil |

---

## Resultado Esperado

1. **Flujo de onboarding corregido**: Al terminar el wizard, llegas al dashboard sin redirecciones extrañas
2. **Formulario WordPress responsive**: En móvil todos los elementos son fáciles de tocar y leer, con espaciado adecuado

---

## Seccion Tecnica

### Cambio en Onboarding.tsx

```typescript
// Añadir al inicio del archivo
import { useQueryClient } from '@tanstack/react-query';

// Dentro del componente
const queryClient = useQueryClient();

// En handleFinish()
const handleFinish = async () => {
  setIsLoading(true);
  try {
    const finalSector = sector === 'otro' ? customSector : sector;
    
    await createSite.mutateAsync({
      name: name.trim(),
      sector: finalSector,
      // ... resto de campos
    });

    // NUEVO: Esperar a que el cache se actualice
    await queryClient.refetchQueries({ queryKey: ['sites'] });

    // Ahora navegar (el ProtectedRoute verá sites.length > 0)
    navigate('/dashboard');
  } catch (error) {
    console.error('Error creating site:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### Cambios en WordPressConfigForm.tsx

```tsx
// CardDescription con mejor flujo
<CardDescription>
  <span>Conecta tu sitio WordPress para publicar artículos directamente.</span>
  <a
    href="..."
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1 text-primary hover:underline mt-2 sm:mt-0 sm:inline-flex sm:ml-1"
  >
    ¿Cómo crear una contraseña?
    <ExternalLink className="w-3 h-3" />
  </a>
</CardDescription>

// Inputs más grandes para touch
<Input
  id="site_url"
  placeholder="https://tu-sitio.com"
  className="h-12 text-base"
  {...register('site_url')}
/>

// Espaciado mejorado entre campos
<div className="space-y-4 sm:space-y-5">

// Botón mostrar/ocultar más grande
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
>
  {showPassword ? 'Ocultar' : 'Mostrar'}
</button>

// Botones que se apilan en móvil
<div className="flex flex-col sm:flex-row gap-3 pt-4">
  <Button
    type="submit"
    disabled={upsertMutation.isPending || (!isDirty && !!config)}
    className="w-full sm:w-auto h-12 sm:h-10"
  >
    ...
  </Button>

  {config && (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" type="button" className="w-full sm:w-auto h-12 sm:h-10">
          ...
        </Button>
      </AlertDialogTrigger>
      ...
    </AlertDialog>
  )}
</div>
```
