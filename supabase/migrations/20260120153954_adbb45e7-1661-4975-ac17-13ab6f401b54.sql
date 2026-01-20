-- Create farmacias table
CREATE TABLE public.farmacias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  languages TEXT[] NOT NULL DEFAULT ARRAY['spanish'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create articulos table
CREATE TABLE public.articulos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmacia_id UUID NOT NULL REFERENCES public.farmacias(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  topic TEXT NOT NULL,
  content_spanish JSONB,
  content_catalan JSONB,
  image_url TEXT,
  image_photographer TEXT,
  image_photographer_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(farmacia_id, month, year)
);

-- Enable RLS on both tables
ALTER TABLE public.farmacias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articulos ENABLE ROW LEVEL SECURITY;

-- Since user mentioned only they will use it, create public policies for simplicity
-- (No auth required for personal use)
CREATE POLICY "Allow all operations on farmacias"
ON public.farmacias
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on articulos"
ON public.articulos
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_farmacias_updated_at
BEFORE UPDATE ON public.farmacias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_articulos_farmacia_id ON public.articulos(farmacia_id);
CREATE INDEX idx_articulos_month_year ON public.articulos(month, year);