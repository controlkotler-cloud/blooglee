

# Plan: Punto 2 y Punto 3 - Actualizacion de datos y tiempos

## Punto 2: Corregir comportamiento de descargas multiples

### Problema actual

En `supabase/functions/subscribe-newsletter/index.ts` (lineas 91-96):

```typescript
if (existing) {
  if (existing.is_active) {
    // Solo devuelve mensaje, NO actualiza datos
    return { success: true, message: "Ya estás suscrito..." };
  }
}
```

Si un usuario descarga un segundo recurso con datos diferentes (nuevo nombre, cambio de Empresa a Agencia), los nuevos datos se **ignoran**.

### Solucion

Modificar la edge function para que **siempre actualice** el perfil cuando el usuario esta activo, manteniendo los datos mas recientes:

**Cambio en `supabase/functions/subscribe-newsletter/index.ts`:**

```typescript
if (existing) {
  if (existing.is_active) {
    // SIEMPRE actualizar datos aunque ya este suscrito
    await supabase
      .from('newsletter_subscribers')
      .update({ 
        name: cleanName,
        audience,
        source, // Actualizar ultimo source
      })
      .eq('id', existing.id);
      
    return new Response(
      JSON.stringify({ success: true, message: `¡Hola de nuevo, ${cleanName}! Tu perfil ha sido actualizado.` }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
  // ... resto igual para reactivacion
}
```

### Nuevo comportamiento

| Escenario | Antes | Despues |
|-----------|-------|---------|
| Usuario descarga recurso 1 como "Juan" + "Empresa" | Se guarda correctamente | Se guarda correctamente |
| Usuario descarga recurso 2 como "Juan P." + "Agencia" | Se ignora | Se actualiza name y audience |
| Usuario ya existente descarga nuevo recurso | Solo mensaje | Actualiza source y muestra confirmacion |

---

## Punto 3: Corregir tiempos en toda la web

### Flujo real de Blooglee (tu especificacion)

| Fase | Primer articulo | Siguientes (automatico) | Siguientes (manual) |
|------|-----------------|------------------------|---------------------|
| Configurar sitio | 2-3 min (una vez) | 0 | 0 |
| Generar articulo | 60 seg | Automatico (0) | 60 seg (1 clic) |
| Revisar | 2-3 min (opcional) | 0 | 1-2 min (opcional) |
| Publicar | 1 clic | Automatico (0) | 1 clic |
| **TOTAL** | ~5 min | **0 min** | **~2 min** |

### Mensaje clave a comunicar

> "Configura una vez, olvdate para siempre. Blooglee publica mientras tu te dedicas a tu negocio."

### Archivos a modificar

#### 1. `public/resources/plantilla-tareas-redactar.html`

**Cambios principales:**

- Anadir seccion que diferencie "Primer articulo" vs "Siguientes articulos"
- Cambiar el total de "~15 minutos" a mostrar dos escenarios:
  - Modo automatico: **0 min** (Blooglee publica solo)
  - Modo manual: **~2 min** (revisar y publicar)
- Ajustar comparativas para reflejar el ahorro real

**Tabla actualizada:**

| Tarea | Manual | Blooglee (1er post) | Blooglee (siguientes) |
|-------|--------|---------------------|----------------------|
| Investigar tema | 30-45 min | Automatico | Automatico |
| Escribir borrador | 2-3 horas | 60 seg | 60 seg |
| Revisar | 30-45 min | 2-3 min (opcional) | 0 min (opcional) |
| Publicar | 15-20 min | 1 clic | Automatico |
| **TOTAL** | 4-6 horas | ~5 min | **0 min** (auto) / ~2 min (manual) |

#### 2. `src/pages/HowItWorks.tsx`

**Cambios:**

- Anadir nota en el paso 4 indicando que es **opcional en modo automatico**
- Actualizar el resumen para mostrar que "Siguientes articulos: 0 minutos"
- Modificar el badge de "Tiempo total: ~5 minutos" para aclarar que es solo la primera vez

**Nuevo paso 4:**

```typescript
{
  number: '04',
  icon: Send,
  title: 'Revisa y publica (o automatiza)',
  description: 'En modo manual: revisa la vista previa y publica con un clic. En modo automatico: Blooglee publica por ti sin que tengas que hacer nada.',
  time: 'Opcional',
  color: 'from-orange-400 to-amber-400',
}
```

**Nuevo resumen (4 items):**

| Item | Texto | Subtexto |
|------|-------|----------|
| Conectas WordPress | Una sola vez | - |
| Configuras sector | Una sola vez | - |
| Siguientes articulos | **0 minutos** | Modo automatico |
| O revisas antes | ~2 min | Modo manual |

#### 3. `src/pages/FeaturesPage.tsx` (linea 126)

**Cambio menor:**

```typescript
// De:
{ feature: 'Tiempo por artículo', manual: '2-4 horas', blooglee: '2 minutos' },

// A:
{ feature: 'Tiempo por artículo', manual: '2-4 horas', blooglee: '0 min (auto) / 2 min' },
```

#### 4. `src/pages/usecases/Autonomos.tsx` (linea 66)

Ya dice "5min a la semana" que es correcto para el tiempo total de gestion, no por articulo. Se puede mantener o ajustar a "0-2 min por post".

---

## Seccion Tecnica

### Archivos a modificar

| Archivo | Cambio principal |
|---------|-----------------|
| `supabase/functions/subscribe-newsletter/index.ts` | Actualizar datos aunque el email ya exista activo |
| `public/resources/plantilla-tareas-redactar.html` | Nueva seccion diferenciando 1er articulo vs siguientes |
| `src/pages/HowItWorks.tsx` | Paso 4 opcional, resumen con modo automatico |
| `src/pages/FeaturesPage.tsx` | Actualizar comparativa de tiempos |

### Edge function: Despliegue automatico

La edge function `subscribe-newsletter` se desplegara automaticamente al guardar los cambios.

---

## Resultado esperado

1. **Punto 2:** Los usuarios pueden cambiar de perfil (Empresa <-> Agencia) y actualizar su nombre en cualquier descarga posterior
2. **Punto 3:** Toda la web comunica claramente que Blooglee es **0 tiempo en modo automatico** y **~2 minutos maximo en modo manual** despues de la configuracion inicial

