
## Plan: Mejoras SEO, UX y Optimización del Blog

### Resumen de Cambios

Se implementarán 4 mejoras principales para optimizar el SEO, UX y rendimiento:

1. **Paginación funcional y filtros de categorías** en el blog
2. **Tabla de Contenidos (ToC) dinámica** en los posts
3. **Sección FAQ con Schema FAQPage** en Pricing
4. **Lazy loading** para imágenes below-the-fold

---

### 1. Paginación Funcional y Filtros de Categorías

**Archivo:** `src/pages/BlogIndex.tsx`

#### Estado Actual
- Los botones de paginación son decorativos (sin funcionalidad)
- Los filtros de categorías no tienen `onClick`
- Se muestran todos los posts sin filtrar

#### Implementación
```typescript
// Añadir estado para categoría activa y página
const [selectedCategory, setSelectedCategory] = useState('Todos');
const [currentPage, setCurrentPage] = useState(1);
const POSTS_PER_PAGE = 4;

// Filtrar posts por categoría
const filteredPosts = selectedCategory === 'Todos' 
  ? blogPosts 
  : blogPosts.filter(post => post.category === selectedCategory);

// Calcular paginación
const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
const paginatedPosts = filteredPosts.slice(
  (currentPage - 1) * POSTS_PER_PAGE,
  currentPage * POSTS_PER_PAGE
);

// Resetear página al cambiar categoría
const handleCategoryChange = (category: string) => {
  setSelectedCategory(category);
  setCurrentPage(1);
};
```

#### Componente de Paginación
```typescript
// Actualizar sidebar con conteo real de artículos por categoría
const categoryCounts = useMemo(() => {
  return categories.slice(1).reduce((acc, cat) => {
    acc[cat] = blogPosts.filter(p => p.category === cat).length;
    return acc;
  }, {} as Record<string, number>);
}, []);
```

---

### 2. Tabla de Contenidos Dinámica

**Archivo:** `src/pages/BlogPost.tsx`

#### Estado Actual
- ToC es hardcoded con enlaces placeholder (`href="#"`)
- No corresponde al contenido real del artículo

#### Implementación
```typescript
// Utilidad para extraer headings del contenido markdown
const extractHeadings = (content: string): { id: string; text: string; level: number }[] => {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = content.split('\n');
  
  lines.forEach(line => {
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);
    
    if (h2Match) {
      const text = h2Match[1].trim();
      const id = text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      headings.push({ id, text, level: 2 });
    } else if (h3Match) {
      const text = h3Match[1].trim();
      const id = text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      headings.push({ id, text, level: 3 });
    }
  });
  
  return headings;
};

// En el componente
const headings = useMemo(() => extractHeadings(post.content), [post.content]);
```

#### Renderizado con IDs en encabezados
```typescript
// Mejorar el parser de markdown para añadir IDs a los headings
const parseContent = (content: string): string => {
  return content
    .replace(/^## (.+)$/gm, (_, title) => {
      const id = title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return `<h2 id="${id}">${title}</h2>`;
    })
    .replace(/^### (.+)$/gm, (_, title) => {
      const id = title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return `<h3 id="${id}">${title}</h3>`;
    })
    // ... resto del parsing
};
```

#### ToC en Sidebar
```tsx
<nav className="space-y-2">
  {headings.map((heading, index) => (
    <a 
      key={index}
      href={`#${heading.id}`}
      className={`block text-sm text-foreground/70 hover:text-foreground transition-colors py-1 ${
        heading.level === 3 ? 'pl-4' : ''
      }`}
    >
      {heading.text}
    </a>
  ))}
</nav>
```

---

### 3. Sección FAQ con Schema FAQPage

**Archivo:** `src/pages/Pricing.tsx`

#### Datos FAQ
```typescript
const pricingFaqs = [
  {
    question: '¿Puedo cambiar de plan en cualquier momento?',
    answer: 'Sí, puedes cambiar tu plan en cualquier momento. Si subes de plan, el cambio es inmediato. Si bajas, se aplicará al siguiente ciclo de facturación.',
  },
  {
    question: '¿Hay permanencia o compromiso?',
    answer: 'No, no hay permanencia. Puedes cancelar tu suscripción cuando quieras sin penalizaciones ni cargos adicionales.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express). También aceptamos PayPal y transferencia bancaria para planes anuales.',
  },
  {
    question: '¿Qué incluye el plan gratuito?',
    answer: 'El plan gratuito incluye 1 sitio web y 1 artículo publicado con imagen destacada y SEO optimizado. Es perfecto para probar Blooglee sin compromiso.',
  },
  {
    question: '¿Ofrecen descuentos para agencias con más de 10 sitios?',
    answer: 'Sí, ofrecemos planes personalizados para agencias con necesidades especiales. Contacta con nuestro equipo en hola@blooglee.com para una propuesta a medida.',
  },
  {
    question: '¿Cómo funciona la facturación anual?',
    answer: 'Con la facturación anual ahorras un 20% respecto al pago mensual. Se cobra el importe total del año por adelantado y recibes acceso inmediato a todas las funciones de tu plan.',
  },
];
```

#### Componente FAQ con Accordion
```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FAQSchema } from '@/components/seo';

// En Pricing.tsx, añadir sección FAQ después de "Plan personalizado"
<section className="pb-20 sm:pb-32 px-4">
  <div className="max-w-4xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
        Preguntas frecuentes
      </h2>
      <p className="text-foreground/70">
        Resolvemos tus dudas sobre los planes y la facturación
      </p>
    </div>
    
    <div className="glass-card-strong rounded-3xl p-6 sm:p-8">
      <Accordion type="single" collapsible className="space-y-4">
        {pricingFaqs.map((faq, index) => (
          <AccordionItem 
            key={index} 
            value={`faq-${index}`}
            className="border-b border-border/50 last:border-0"
          >
            <AccordionTrigger className="text-left font-medium hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-foreground/70">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </div>
</section>

{/* Schema FAQPage para SEO */}
<FAQSchema faqs={pricingFaqs} />
```

---

### 4. Lazy Loading para Imágenes

**Archivos a modificar:**
- `src/components/marketing/BlogCard.tsx`
- `src/pages/BlogPost.tsx`
- `src/pages/Landing.tsx`
- `src/pages/FeaturesPage.tsx`

#### Implementación
Añadir `loading="lazy"` a todas las imágenes que no estén above-the-fold:

```tsx
// BlogCard.tsx - Imagen de artículo
<img 
  src={image} 
  alt={`Imagen destacada del artículo: ${title}`}
  loading="lazy"
  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
/>

// BlogPost.tsx - Imagen destacada del post
<img 
  src={post.image} 
  alt={`Imagen destacada: ${post.title}`}
  loading="lazy"
  className="w-full h-full object-cover"
/>

// BlogPost.tsx - Imágenes de autor
<img 
  src={post.author.avatar} 
  alt={`Foto de ${post.author.name}`}
  loading="lazy"
  className="w-10 h-10 rounded-full object-cover"
/>

// Landing.tsx - Avatares de testimonios (below hero)
<img
  key={i}
  src={src}
  alt="Usuario de Blooglee"
  loading="lazy"
  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 sm:border-3 border-white object-cover shadow-md"
/>
```

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/BlogIndex.tsx` | Estado de paginación, filtros de categorías, lógica de paginación |
| `src/pages/BlogPost.tsx` | ToC dinámica, IDs en headings, lazy loading imágenes |
| `src/pages/Pricing.tsx` | Sección FAQ, import FAQSchema, datos de preguntas |
| `src/components/marketing/BlogCard.tsx` | Lazy loading + alt descriptivo |
| `src/pages/Landing.tsx` | Lazy loading en avatares below-the-fold |

---

### Beneficios SEO y UX

| Mejora | Impacto SEO | Impacto UX |
|--------|-------------|------------|
| Paginación funcional | Mejor crawlabilidad | Navegación más clara |
| Filtros de categorías | URLs con parámetros | Descubrimiento de contenido |
| ToC dinámica | Anchor links indexables | Navegación rápida en artículos |
| FAQ con Schema | Rich snippets en Google | Respuestas rápidas a dudas |
| Lazy loading | Mejor Core Web Vitals (LCP) | Carga más rápida |

---

### Resultado Esperado

1. **Blog funcional**: Los usuarios pueden filtrar por categoría y navegar entre páginas
2. **ToC útil**: Genera automáticamente índice basado en H2/H3 del contenido real
3. **FAQ en Pricing**: 6 preguntas frecuentes con posibilidad de aparecer en AI Overviews
4. **Rendimiento**: Imágenes se cargan bajo demanda, mejorando LCP en ~20-30%
