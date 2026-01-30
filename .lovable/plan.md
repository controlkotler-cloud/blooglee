

# Plan: Solucionar la Comunicacion de "Descarga" vs HTML

## El Problema

Actualmente el flujo es:
1. Usuario hace clic en "Descargar gratis"
2. Rellena formulario
3. Hace clic en "Descargar PDF/Calendario/etc"
4. Se abre un HTML en nueva pestana (NO se descarga nada)

Esto genera confusion porque prometemos "descargar" pero no descargamos nada.

---

## Opciones de Solucion

| Opcion | Que cambia | Pros | Contras |
|--------|------------|------|---------|
| **A: Cambiar la comunicacion** | Usar "Acceder" o "Ver recurso" en lugar de "Descargar" | Simple, rapido, honesto | Menos atractivo que "Descargar" |
| **B: Forzar descarga del HTML** | Usar atributo `download` para que el navegador descargue el .html | El archivo SI se descarga | El usuario recibe un .html que puede confundir |
| **C: Anadir instrucciones claras** | Tras abrir, mostrar un toast/aviso explicando "Guarda como PDF con Ctrl+P" | Mantiene "Descargar", educa al usuario | Requiere accion extra del usuario |
| **D: Subir PDFs reales a Storage** | Generar PDFs y subirlos a Supabase Storage | Descarga real de PDF | Requiere generar 12 PDFs manualmente |

---

## Recomendacion: Opcion A + C (Hibrida)

La solucion mas honesta y practica es **cambiar el lenguaje** en la interfaz y **anadir instrucciones** cuando se abre el recurso:

### Cambios en la Comunicacion

| Ubicacion | Texto actual | Texto nuevo |
|-----------|--------------|-------------|
| `LeadMagnetCard.tsx` boton | "Descargar gratis" | "Obtener gratis" |
| `LeadMagnetModal.tsx` titulo | "Listo para descargar!" | "Tu recurso esta listo!" |
| `LeadMagnetModal.tsx` boton final | "Descargar {tipo}" | "Ver recurso" |
| `LeadMagnetModal.tsx` descripcion post-submit | "Gracias... Tu descarga esta lista" | "Gracias... Pulsa para abrir tu recurso." |

### Instrucciones en el Modal

Anadir un pequeno texto debajo del boton final:

```
"Se abrira en una nueva pestana. Puedes guardarlo como PDF desde el menu Imprimir (Ctrl+P / Cmd+P)."
```

### Alternativa Visual (sin texto extra)

Cambiar el icono de `Download` a `ExternalLink` o `FileText` para que el usuario entienda visualmente que se abre algo, no que se descarga.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/marketing/LeadMagnetCard.tsx` | Boton: "Obtener gratis" + cambiar icono a `Gift` o mantener `Download` |
| `src/components/marketing/LeadMagnetModal.tsx` | Titulo, descripcion, boton final + instrucciones de guardado |

---

## Codigo Propuesto

### LeadMagnetCard.tsx (linea 48-56)

```tsx
<Button 
  onClick={() => onDownloadClick(leadMagnet)}
  variant="outline"
  size="sm"
  className="group-hover:bg-violet-50 group-hover:border-violet-200"
>
  <Gift className="w-4 h-4 mr-2" />
  Obtener gratis
</Button>
```

### LeadMagnetModal.tsx (seccion downloadReady)

```tsx
{downloadReady ? (
  <div className="flex flex-col items-center py-6">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4">
      <FileText className="w-8 h-8 text-white" />
    </div>
    <Button 
      onClick={handleDownload}
      className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400"
    >
      <ExternalLink className="w-4 h-4 mr-2" />
      Ver recurso
    </Button>
    <p className="text-xs text-foreground/50 mt-3 text-center max-w-xs">
      Se abre en nueva pestana. Guarda como PDF con Ctrl+P (Windows) o Cmd+P (Mac).
    </p>
  </div>
)}
```

### Titulo y descripcion del modal

```tsx
<DialogTitle>
  {downloadReady ? '¡Tu recurso esta listo!' : `Accede a: ${leadMagnet.title}`}
</DialogTitle>
<DialogDescription>
  {downloadReady 
    ? 'Gracias por suscribirte. Pulsa el boton para abrir tu recurso.'
    : 'Introduce tus datos para acceder al recurso gratuito.'}
</DialogDescription>
```

---

## Resultado Final

1. **Honestidad:** No prometemos "descargar" cuando realmente abrimos un HTML
2. **Claridad:** El usuario sabe exactamente que va a pasar (se abre en nueva pestana)
3. **Utilidad:** Damos instrucciones claras de como guardar como PDF si lo desea
4. **Conversion:** "Obtener gratis" sigue siendo atractivo para captar leads

