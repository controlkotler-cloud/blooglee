export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  category: 'multiidioma' | 'seguridad' | 'permisos' | 'general';
  plugin?: string;
  code: string;
  instructions: string;
  fileName?: string;
}

export const CODE_SNIPPETS: CodeSnippet[] = [
  {
    id: 'yoast-api-support',
    title: 'Yoast SEO - Soporte API REST',
    description: 'Habilita la edición de meta descripción, SEO title y focus keyword vía API',
    category: 'general',
    plugin: 'yoast',
    fileName: 'functions.php',
    code: `/**
 * Blooglee - Yoast SEO API Support
 * Registra los campos de Yoast para la REST API
 * Prioridad 20 para ejecutar DESPUÉS de que Yoast cargue sus campos
 */
add_action('init', function() {
    $meta_keys = [
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_title',
        '_yoast_wpseo_focuskw',
    ];
    foreach ($meta_keys as $key) {
        register_post_meta('post', $key, [
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => 'string',
            'auth_callback' => '__return_true',
        ]);
    }
}, 20);`,
    instructions: `⚠️ SIN ESTE SNIPPET, Yoast ignorará la meta descripción, SEO title y focus keyword que Blooglee envía. Solo verás el excerpt como fallback.

PASO 1 — Añadir el código:
1. Accede a tu WordPress como administrador
2. Ve a **Apariencia → Editor de archivos del tema** (o edita por FTP)
3. Selecciona tu **tema hijo** (child theme)
4. Abre **functions.php** y añade el código **al final** del archivo
5. Guarda los cambios

PASO 2 — Verificar que funciona:
1. Genera y publica un artículo desde Blooglee
2. En tu WordPress, abre el post publicado
3. Baja hasta la sección de Yoast SEO
4. Comprueba que aparecen:
   - **Meta descripción** (no vacía)
   - **SEO Title** (no el título por defecto)
   - **Focus keyword** (la palabra clave del artículo)

💡 Si sigues sin ver los campos de Yoast, comprueba que:
- Tienes Yoast SEO activo y actualizado
- Estás editando el functions.php del **tema hijo**, no del tema padre
- No hay otro plugin de SEO (Rank Math, All in One SEO) en conflicto

⚠️ Si no tienes un tema hijo, créalo primero para evitar perder los cambios al actualizar el tema.`,
  },
  {
    id: 'polylang-api-support',
    title: 'Polylang - Publicar en varios idiomas',
    description: 'Configura Polylang para publicar artículos en español y catalán vía API',
    category: 'multiidioma',
    plugin: 'polylang',
    fileName: 'functions.php',
    code: `/**
 * Blooglee - Polylang API REST Support
 * Añade este código al functions.php de tu tema hijo
 * Permite a Blooglee publicar artículos en el idioma correcto
 */
add_action('rest_api_init', function() {
    register_rest_field('post', 'lang', array(
        'get_callback' => function($post) {
            return pll_get_post_language($post['id']);
        },
        'update_callback' => function($value, $post) {
            if (!empty($value)) {
                pll_set_post_language($post->ID, $value);
            }
        },
        'schema' => array(
            'description' => 'Post language code',
            'type' => 'string',
        ),
    ));
});`,
    instructions: `⚠️ IMPORTANTE: Sin este snippet, todos los artículos se publicarán en el idioma por defecto de tu WordPress, ignorando el catalán.

PASO 1 — Añadir el código:
1. Accede a tu WordPress como administrador
2. Ve a **Apariencia → Editor de temas** (o edita por FTP)
3. Selecciona tu **tema hijo** (child theme)
4. Abre **functions.php** y añade el código al final
5. Guarda los cambios

PASO 2 — Configurar Polylang:
1. Ve a **Idiomas → Configuración**
2. Asegúrate de tener configurados los idiomas: **Español (es)** y **Catalán (ca)**
3. En **Idiomas → Configuración → URL**, usa la opción "El idioma se define por el contenido"

PASO 3 — Verificar:
1. Genera un artículo con español y catalán activados en Blooglee
2. Publica desde Blooglee → deberías ver dos posts: uno en "es" y otro en "ca"
3. En tu WordPress, ve a **Entradas** y verifica que cada post tiene el idioma correcto asignado

💡 Si usas WPML en vez de Polylang, usa el snippet de "WPML - Soporte API REST" en su lugar.
⚠️ Si no tienes un tema hijo, créalo primero para evitar perder cambios al actualizar el tema.`,
  },
  {
    id: 'wpml-api-support',
    title: 'WPML - Soporte API REST',
    description: 'Configura WPML para aceptar idioma en publicaciones vía API',
    category: 'multiidioma',
    plugin: 'wpml',
    fileName: 'functions.php',
    code: `/**
 * Blooglee - WPML API REST Support
 * Añade este código al functions.php de tu tema hijo
 */
add_action('rest_api_init', function() {
    register_rest_field('post', 'wpml_language', array(
        'get_callback' => function($post) {
            return apply_filters('wpml_post_language_details', null, $post['id']);
        },
        'update_callback' => function($value, $post) {
            if (!empty($value) && function_exists('wpml_set_element_language_details')) {
                $language_details = array(
                    'element_id' => $post->ID,
                    'element_type' => 'post_post',
                    'trid' => false,
                    'language_code' => $value,
                    'source_language_code' => null
                );
                wpml_set_element_language_details($language_details);
            }
        },
        'schema' => array(
            'description' => 'WPML language code',
            'type' => 'string',
        ),
    ));
});`,
    instructions: `1. Accede a tu WordPress
2. Ve a **Apariencia → Editor de temas**
3. Selecciona tu tema hijo
4. Abre **functions.php**
5. Añade el código al final
6. Guarda los cambios
7. En WPML, asegúrate de tener habilitado "Allow translation management in REST API"`,
  },
  {
    id: 'wordfence-whitelist',
    title: 'Wordfence - Whitelist Blooglee',
    description: 'Añade excepciones para permitir las peticiones de Blooglee',
    category: 'seguridad',
    plugin: 'wordfence',
    code: `# No es código PHP, son instrucciones de configuración

PASOS EN WORDFENCE:

1. Ve a Wordfence → Firewall
2. Clic en "Manage Firewall"
3. En "Whitelisted URLs", añade:
   - /wp-json/wp/v2/*
   - /wp-json/pll/v1/* (si usas Polylang)
   
4. En "Advanced Firewall Options":
   - Busca "Application Passwords"
   - Asegúrate de que NO esté bloqueado
   
5. Guarda los cambios`,
    instructions: `1. Accede a tu WordPress como administrador
2. Ve a **Wordfence → Firewall**
3. Clic en **Manage Firewall**
4. En la sección "Whitelisted URLs", añade las rutas de la API REST
5. Guarda los cambios
6. Prueba la conexión de nuevo en Blooglee`,
  },
  {
    id: 'ithemes-api-enable',
    title: 'iThemes Security - Habilitar API REST',
    description: 'Reactiva la API REST bloqueada por iThemes Security',
    category: 'seguridad',
    plugin: 'ithemes',
    code: `# Instrucciones de configuración iThemes Security

PASOS:

1. Ve a Security → Settings
2. Busca "WordPress Tweaks" o "Ajustes de WordPress"
3. Localiza la opción "REST API"
4. Selecciona "Default Access" o "Acceso por defecto"
5. Guarda los cambios

Si usas iThemes Security Pro:
1. Ve a Security → Settings → Lockouts
2. Asegúrate de que tu IP no esté bloqueada
3. En "Application Passwords", verifica que esté habilitado`,
    instructions: `1. Accede a WordPress como administrador
2. Ve a **Security → Settings**
3. Busca la configuración de "REST API" o "API REST"
4. Cambia a "Default Access"
5. Guarda y prueba la conexión`,
  },
  {
    id: 'force-app-passwords',
    title: 'Forzar Application Passwords',
    description: 'Habilita contraseñas de aplicación en entornos localhost o sin SSL',
    category: 'permisos',
    fileName: 'wp-config.php',
    code: `/**
 * Blooglee - Force Application Passwords
 * Añade esto ANTES de "That's all, stop editing!"
 */
define('WP_ENVIRONMENT_TYPE', 'local');

// O alternativamente, para forzar en cualquier entorno:
add_filter('wp_is_application_passwords_available', '__return_true');`,
    instructions: `1. Accede a tu servidor vía FTP o File Manager
2. Abre el archivo **wp-config.php** en la raíz de WordPress
3. Busca la línea que dice "That's all, stop editing!"
4. Añade el código ANTES de esa línea
5. Guarda el archivo
6. Ahora podrás crear contraseñas de aplicación en tu perfil`,
  },
  {
    id: 'cors-headers',
    title: 'CORS Headers para Imágenes',
    description: 'Permite la carga de imágenes desde Blooglee',
    category: 'general',
    fileName: '.htaccess',
    code: `# Blooglee CORS Headers
# Añade esto al .htaccess en la raíz de WordPress

<IfModule mod_headers.c>
    # Allow cross-origin requests for images
    <FilesMatch "\\.(gif|ico|jpg|jpeg|png|webp|svg)$">
        Header set Access-Control-Allow-Origin "*"
    </FilesMatch>
    
    # Allow API requests
    <FilesMatch "^wp-json">
        Header set Access-Control-Allow-Origin "*"
        Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    </FilesMatch>
</IfModule>`,
    instructions: `1. Accede a tu servidor vía FTP
2. Localiza el archivo **.htaccess** en la raíz de WordPress
3. Haz una copia de seguridad del archivo
4. Añade el código al principio del archivo
5. Guarda los cambios

⚠️ Si algo deja de funcionar, restaura la copia de seguridad.`,
  },
];

export function getSnippetsByCategory(category: CodeSnippet['category']): CodeSnippet[] {
  return CODE_SNIPPETS.filter(s => s.category === category);
}

export function getSnippetByPlugin(plugin: string): CodeSnippet | undefined {
  return CODE_SNIPPETS.find(s => s.plugin === plugin);
}

export function getSnippetById(id: string): CodeSnippet | undefined {
  return CODE_SNIPPETS.find(s => s.id === id);
}
