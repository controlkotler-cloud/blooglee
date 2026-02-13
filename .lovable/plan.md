

## Renombrar "Tema personalizado" a "Enfoque de contenido"

### Decision de nombre

El mejor nombre es **"Enfoque de contenido"** con la descripcion: *"Indica la direccion tematica que quieres para tus articulos"*.

**Por que este nombre**:
- Comunica que es una **direccion estrategica**, no un tema concreto para un solo articulo
- Es intuitivo para usuarios no tecnicos
- Refleja exactamente como lo usa la IA: como una directriz global que orienta TODOS los temas generados
- Es corto y claro

### Cambios a realizar

**Solo cambios de UI** (la columna en base de datos sigue siendo `custom_topic`, sin migracion necesaria):

#### 1. SiteSettings.tsx
- Label: "Tema personalizado (opcional)" -> "Enfoque de contenido (opcional)"
- Placeholder: actualizar a algo como *"Ej: Consejos practicos de salud para familias jovenes, novedades del sector tech..."*
- Texto de ayuda: cambiar *"Si lo dejas vacio, generaremos temas automaticamente segun tu sector"* por *"Define la direccion tematica de tus articulos. Si lo dejas vacio, la IA elegira los mejores temas segun tu sector y pilares de contenido."*

#### 2. SiteImportExport.tsx
- Actualizar el mensaje de error y la cabecera CSV si hace referencia a "tema personalizado"

#### 3. CompanyForm.tsx (zona MKPro)
- **NO se modifica** (zona protegida segun las reglas de arquitectura)

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/saas/SiteSettings.tsx` | Label, placeholder y texto de ayuda |
| `src/components/saas/SiteImportExport.tsx` | Texto del toast de error |

No se requiere migracion de base de datos ni cambios en Edge Functions (el campo interno sigue siendo `custom_topic`).

