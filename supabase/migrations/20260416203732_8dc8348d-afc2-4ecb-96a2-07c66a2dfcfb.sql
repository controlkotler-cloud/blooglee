UPDATE public.prompts
SET 
  content = REPLACE(
    content,
    '- Incluye 2 enlaces a fuentes de autoridad relevantes para el sector',
    '- Si te hemos proporcionado un "pool de fuentes", incluye 2 enlaces a dominios EXACTOS de ese pool. Si NO hay pool, NO incluyas ningún enlace externo (es preferible ningún enlace a uno inventado).'
  ),
  version = COALESCE(version, 1) + 1,
  updated_at = now()
WHERE key = 'saas.article.system'
  AND content LIKE '%Incluye 2 enlaces a fuentes de autoridad relevantes para el sector%';