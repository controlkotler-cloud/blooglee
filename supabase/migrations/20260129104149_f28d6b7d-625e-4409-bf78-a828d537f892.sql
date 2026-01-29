-- Create knowledge_base table for storing WordPress integration articles
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  priority TEXT CHECK (priority IN ('alta', 'media', 'baja')) DEFAULT 'media',
  error_code TEXT,
  title TEXT NOT NULL,
  symptoms TEXT[] DEFAULT '{}',
  cause TEXT,
  solution TEXT NOT NULL,
  solution_steps JSONB,
  snippet_code TEXT,
  related_plugins TEXT[] DEFAULT '{}',
  help_url TEXT,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Knowledge base is publicly readable"
ON public.knowledge_base FOR SELECT
USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage knowledge base"
ON public.knowledge_base FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create support_conversations table
CREATE TABLE public.support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  error_context JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view own conversations
CREATE POLICY "Users can view own conversations"
ON public.support_conversations FOR SELECT
USING (auth.uid() = user_id);

-- Users can create own conversations
CREATE POLICY "Users can create own conversations"
ON public.support_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own conversations
CREATE POLICY "Users can update own conversations"
ON public.support_conversations FOR UPDATE
USING (auth.uid() = user_id);

-- Create support_messages table
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.support_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  suggested_articles UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages from own conversations
CREATE POLICY "Users can view messages from own conversations"
ON public.support_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

-- Users can create messages in own conversations
CREATE POLICY "Users can create messages in own conversations"
ON public.support_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX idx_knowledge_base_priority ON public.knowledge_base(priority);
CREATE INDEX idx_knowledge_base_keywords ON public.knowledge_base USING GIN(keywords);
CREATE INDEX idx_support_conversations_user_id ON public.support_conversations(user_id);
CREATE INDEX idx_support_messages_conversation_id ON public.support_messages(conversation_id);

-- Add trigger for updated_at on knowledge_base
CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();