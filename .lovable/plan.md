
## Eliminar la card de Newsletter del sidebar del Blog y readaptar el layout

### Cambios en `src/pages/BlogIndex.tsx`

**1. Eliminar el sidebar completo y cambiar a layout full-width**

El sidebar actualmente tiene 3 elementos: Newsletter (a eliminar), Categorías populares y CTA. Sin la newsletter, el sidebar queda con solo 2 cards pequeñas que no justifican una columna lateral fija.

La propuesta es:

- Cambiar el grid de `lg:grid-cols-4` (3 contenido + 1 sidebar) a **full-width** para los artículos
- Mover las **Categorías populares** y el **CTA** a una fila horizontal debajo de la paginación, con un diseño compacto y atractivo
- Los artículos pasan de ocupar 3/4 a ocupar todo el ancho, mostrando **3 columnas en desktop** (en lugar de 2) para aprovechar el espacio

**2. Nuevo layout propuesto:**

```
[Header / AudienceCards]
[Filtros de categoría - pills]
[Grid de artículos: 1 col mobile / 2 col tablet / 3 col desktop]
[Paginación]
[Fila: Categorías populares | CTA "Empezar gratis"]
```

### Detalle técnico

- Eliminar el import de `NewsletterForm`
- Eliminar el `<aside>` con el sidebar completo
- Cambiar el grid principal de `grid-cols-1 lg:grid-cols-4` a simplemente un contenedor sin sidebar
- Cambiar el grid de artículos de `grid-cols-1 sm:grid-cols-2` a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` para aprovechar el ancho completo
- Añadir debajo de la paginación una sección con las categorías populares y el CTA en disposición horizontal (`grid-cols-1 md:grid-cols-2`)
- Eliminar la referencia a `Mail` en imports si no se usa en otro sitio

### Resultado

- La newsletter solo se muestra en el footer (donde ya existe)
- Los artículos ocupan todo el ancho con 3 columnas en desktop, mejor aprovechamiento del espacio
- Las categorías populares y el CTA siguen visibles pero integrados al final del contenido
- El diseño se mantiene coherente para las vistas "todos", "empresas" y "agencias"
