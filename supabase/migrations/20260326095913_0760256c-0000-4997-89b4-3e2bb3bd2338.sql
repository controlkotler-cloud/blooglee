UPDATE prompts SET content = 'Generate a professional blog header image for a {{sector}} business.

TOPIC: "{{topic}}"
{{description}}

COMPOSITION: {{composition_style}}

MOOD: {{mood}}

COLOR INSPIRATION: The overall color feeling should lean towards {{color_palette}} tones.

VISUAL STYLE GUIDELINES:
- Editorial photography style, high quality
- The composition must feel intentional and varied, not generic
- Lighting should match the mood specified above
- Colors should subtly influence the scene (background, props, lighting) but NOT be displayed as literal swatches

STRICT REQUIREMENTS:
- NO text of any kind (no letters, no numbers, no hex codes, no labels)
- NO color palettes, NO color swatches, NO color bars, NO hex color codes rendered in the image
- NO logos, NO watermarks
- NO human faces
- NO masks
- All products must be completely generic and unbranded
- No visible text, labels or packaging on any product
- The image must be a clean photograph with NO overlays, annotations, or design elements
- Suitable for blog header, 16:9 ratio', updated_at = now() WHERE key = 'saas.image';