-- Añadir columna description a la tabla empresas (igual que en sites SaaS)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS description TEXT;

-- Actualizar MKPro con su descripción correcta de audiencia
UPDATE empresas 
SET description = 'MKPro es una agencia de marketing digital que ayuda a autónomos, pymes y empresas B2B a crecer online. Nuestro blog busca atraer clientes potenciales ofreciéndoles consejos prácticos de marketing, SEO, redes sociales y estrategias digitales para hacer crecer sus negocios.'
WHERE name ILIKE '%mkpro%';