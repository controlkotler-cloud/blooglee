

## Integrar Google Analytics en Blooglee

### Que se hara

Insertar la etiqueta de Google Analytics (G-L0545SN8CD) en el archivo `index.html`, justo despues de la apertura del `<head>`, como indica Google.

### Cambio necesario

**Archivo**: `index.html`

Se anadiran las dos lineas del script de Google Tag (gtag.js) inmediatamente despues de `<head>`:

```html
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-L0545SN8CD"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-L0545SN8CD');
    </script>
    <meta charset="UTF-8" />
    ...resto del head existente...
```

### Alcance

- Es un unico cambio en `index.html`. Al ser una SPA (Single Page Application), esta etiqueta cubre todas las paginas automaticamente.
- No se necesitan cambios en componentes React ni en el router.
- No se modifican archivos protegidos de MKPro.

### Seccion tecnica

Google Analytics en una SPA con React Router registra automaticamente el pageview inicial. Para tracking de navegacion entre rutas (sin recarga de pagina), gtag ya captura los cambios de URL gracias a la configuracion por defecto de GA4 que detecta eventos de `history.pushState`. No se requiere integracion adicional con el router.

