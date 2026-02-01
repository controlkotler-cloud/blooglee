import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Prompt {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  content: string;
  variables: string[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PromptInput {
  key: string;
  name: string;
  description?: string;
  category: string;
  content: string;
  variables?: string[];
  is_active?: boolean;
}

const CATEGORIES = ['farmacias', 'empresas', 'saas', 'blog', 'soporte'] as const;
export type PromptCategory = typeof CATEGORIES[number];
export { CATEGORIES };

export function useAdminPrompts(category?: string) {
  return useQuery({
    queryKey: ['admin-prompts', category],
    queryFn: async () => {
      let query = supabase
        .from('prompts')
        .select('*')
        .order('category')
        .order('name');

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as Prompt[];
    },
  });
}

export function usePrompt(id: string) {
  return useQuery({
    queryKey: ['admin-prompt', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Prompt;
    },
    enabled: !!id,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: PromptInput) => {
      const { data, error } = await supabase
        .from('prompts')
        .insert({
          key: input.key,
          name: input.name,
          description: input.description || null,
          category: input.category,
          content: input.content,
          variables: input.variables || [],
          is_active: input.is_active ?? true,
          version: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      toast({
        title: 'Prompt creado',
        description: 'El prompt se ha guardado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al crear prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<PromptInput> & { id: string; incrementVersion?: boolean }) => {
      // Primero obtenemos la versión actual si queremos incrementarla
      let newVersion: number | undefined;
      
      if (input.incrementVersion) {
        const { data: currentPrompt } = await supabase
          .from('prompts')
          .select('version')
          .eq('id', id)
          .single();
        
        newVersion = (currentPrompt?.version || 0) + 1;
      }

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.variables !== undefined) updateData.variables = input.variables;
      if (input.is_active !== undefined) updateData.is_active = input.is_active;
      if (newVersion !== undefined) updateData.version = newVersion;

      const { data, error } = await supabase
        .from('prompts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prompt'] });
      toast({
        title: 'Prompt actualizado',
        description: 'Los cambios se han guardado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al actualizar prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      toast({
        title: 'Prompt eliminado',
        description: 'El prompt se ha eliminado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
