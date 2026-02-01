import { useState, useEffect } from 'react';
import { Prompt, PromptInput, CATEGORIES } from '@/hooks/useAdminPrompts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';

interface PromptEditorProps {
  prompt: Prompt | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PromptInput & { id?: string; incrementVersion?: boolean }) => void;
  isSaving: boolean;
}

export function PromptEditor({ prompt, isOpen, onClose, onSave, isSaving }: PromptEditorProps) {
  const [formData, setFormData] = useState<PromptInput>({
    key: '',
    name: '',
    description: '',
    category: 'saas',
    content: '',
    variables: [],
    is_active: true,
  });
  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    if (prompt) {
      setFormData({
        key: prompt.key,
        name: prompt.name,
        description: prompt.description || '',
        category: prompt.category,
        content: prompt.content,
        variables: prompt.variables || [],
        is_active: prompt.is_active,
      });
    } else {
      setFormData({
        key: '',
        name: '',
        description: '',
        category: 'saas',
        content: '',
        variables: [],
        is_active: true,
      });
    }
  }, [prompt, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt) {
      onSave({ ...formData, id: prompt.id, incrementVersion: true });
    } else {
      onSave(formData);
    }
  };

  const addVariable = () => {
    if (newVariable && !formData.variables?.includes(newVariable)) {
      const formatted = newVariable.startsWith('{{') ? newVariable : `{{${newVariable}}}`;
      setFormData({
        ...formData,
        variables: [...(formData.variables || []), formatted],
      });
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables?.filter((v) => v !== variable) || [],
    });
  };

  const insertVariable = (variable: string) => {
    setFormData({
      ...formData,
      content: formData.content + ' ' + variable,
    });
  };

  const characterCount = formData.content.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {prompt ? (
              <>
                <span>Editar Prompt</span>
                <Badge variant="outline">v{prompt.version}</Badge>
              </>
            ) : (
              'Nuevo Prompt'
            )}
          </DialogTitle>
          <DialogDescription>
            {prompt 
              ? 'Modifica el contenido del prompt. Se guardará como una nueva versión.'
              : 'Crea un nuevo prompt para el sistema.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key (identificador único)</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="generate-article.system.es"
                disabled={!!prompt}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Artículos Farmacia - Sistema"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Prompt principal para generar artículos de blog..."
            />
          </div>

          <div className="space-y-2">
            <Label>Variables disponibles</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.variables?.map((variable) => (
                <Badge
                  key={variable}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20 group"
                  onClick={() => insertVariable(variable)}
                >
                  <span className="font-mono text-xs">{variable}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVariable(variable);
                    }}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                placeholder="nueva.variable"
                className="flex-1 font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addVariable();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addVariable}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Haz clic en una variable para insertarla en el prompt
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Contenido del Prompt</Label>
              <span className="text-xs text-muted-foreground">
                {characterCount.toLocaleString()} caracteres
              </span>
            </div>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Eres un redactor experto en..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !formData.key || !formData.name || !formData.content}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : prompt ? `Guardar como v${prompt.version + 1}` : 'Crear Prompt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
