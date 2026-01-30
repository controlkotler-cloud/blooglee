

# Plan: Corregir generacion automatica y rotar categorias tematicas

## Problemas identificados

### Problema 1: Verificacion de duplicados incorrecta

En `generate-blog-blooglee`, la verificacion de "ya generado hoy" usa:
```typescript
.eq('category', category)  // 'Empresas' o 'Agencias'
```

Pero `category` en la base de datos ahora contiene la categoria tematica (SEO, Marketing, etc.), NO la audiencia. El campo correcto es `audience`.

**Impacto:** La verificacion de duplicados no funciona correctamente.

### Problema 2: La IA siempre elige "Marketing"

No hay rotacion forzada de categorias tematicas. La IA tiene libertad total y tiende a elegir "Marketing" porque es la mas generica.

**Evidencia en la base de datos:**
| Fecha | Audiencia | Categoria |
|-------|-----------|-----------|
| 30 Ene | agencias | Marketing |
| 30 Ene | empresas | Marketing |
| 29 Ene | agencias | Marketing |
| 29 Ene | empresas | Marketing |

Solo el 28 de enero hay variedad porque se generaron manualmente con `forceThematicCategory`.

---

## Solucion

### Cambio 1: Corregir verificacion de duplicados

En `generate-blog-blooglee/index.ts`, linea 605, cambiar:
```typescript
// ANTES (incorrecto)
.eq('category', category)

// DESPUES (correcto)
.eq('audience', category.toLowerCase())
```

### Cambio 2: Implementar rotacion automatica de categorias

Modificar `generate-blog-blooglee` para:
1. Consultar que categorias tematicas ya se han usado recientemente para esa audiencia
2. Elegir automaticamente la categoria menos usada en los ultimos 6 dias
3. Forzar esa categoria en la generacion

**Logica de rotacion:**
```
SEO -> Marketing -> Tutoriales -> Comparativas -> Producto -> Tendencias -> SEO...
```

Esto garantiza que en 6 dias se cubran todas las categorias, y luego se repite el ciclo.

---

## Archivos a modificar

### supabase/functions/generate-blog-blooglee/index.ts

1. **Linea 605:** Corregir filtro de duplicados
   - Cambiar `.eq('category', category)` por `.eq('audience', category.toLowerCase())`

2. **Nueva funcion:** `getNextThematicCategory()`
   - Consultar ultimos 6 posts de esa audiencia
   - Identificar categorias usadas
   - Retornar la siguiente categoria en rotacion que no se haya usado

3. **Linea 626:** Usar categoria rotada automaticamente
   - Si no se proporciona `forceThematicCategory`, calcular automaticamente

### Detalles de la rotacion

La funcion `getNextThematicCategory` hara:

```
1. Obtener ultimos 6 posts de la audiencia (empresas o agencias)
2. Extraer las categorias usadas
3. Orden de rotacion: ['SEO', 'Marketing', 'Tutoriales', 'Comparativas', 'Producto', 'Tendencias']
4. Encontrar la primera categoria que NO este en las usadas recientemente
5. Si todas estan usadas, empezar de nuevo con SEO
```

---

## Resultado esperado

| Dia | Empresas | Agencias |
|-----|----------|----------|
| Lun | SEO | SEO |
| Mar | Marketing | Marketing |
| Mie | Tutoriales | Tutoriales |
| Jue | Comparativas | Comparativas |
| Vie | Producto | Producto |
| Sab | Tendencias | Tendencias |
| Dom | SEO (ciclo) | SEO (ciclo) |

Cada audiencia tendra una categoria diferente cada dia, rotando por las 6 categorias disponibles.

---

## Orden de implementacion

1. Corregir el filtro de duplicados (audience en vez de category)
2. Crear funcion `getNextThematicCategory()`
3. Integrar rotacion en la generacion
4. Desplegar la Edge Function
5. Verificar con una ejecucion de prueba

