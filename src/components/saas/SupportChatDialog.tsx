import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Minimize2, Send, Loader2, RefreshCw, MessageSquare, Plug, FileText, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupportChat } from '@/hooks/useSupportChat';
import { useProfile } from '@/hooks/useProfile';
import { useSites } from '@/hooks/useSites';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface ErrorContext {
  code?: number | string;
  action?: string;
  message?: string;
  siteId?: string;
}

interface SupportChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  errorContext?: ErrorContext;
}

const QUICK_ACTIONS = [
  { icon: Plug, label: 'Problemas de conexión WordPress', message: 'Tengo problemas para conectar mi WordPress con Blooglee' },
  { icon: FileText, label: 'Errores al publicar artículos', message: 'No puedo publicar artículos en mi WordPress' },
  { icon: Globe, label: 'Configuración de idiomas', message: 'Necesito ayuda configurando los idiomas para publicar en español y catalán' },
];

const SUPPORT_LINKS = [
  { icon: Send, label: 'Enviar email', href: 'mailto:soporte@blooglee.com?subject=Soporte%20Blooglee', external: true },
];

export function SupportChatDialog({ isOpen, onClose, errorContext }: SupportChatDialogProps) {
  const { messages, isLoading, error, sendMessage, clearMessages } = useSupportChat();
  const { data: profile } = useProfile();
  const { data: sites = [] } = useSites();
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userMetadata = useMemo(() => ({
    plan: profile?.plan || 'free',
    sitesCount: sites.length,
    email: profile?.email || '',
    registeredAt: profile?.created_at || '',
  }), [profile, sites.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Send initial message if there's error context and no messages
  useEffect(() => {
    if (isOpen && errorContext && messages.length === 0) {
      const contextMessage = `Estoy teniendo un problema: ${errorContext.message || 'Error'} (Código: ${errorContext.code || 'desconocido'})`;
      sendMessage(contextMessage, errorContext, userMetadata);
    }
  }, [isOpen, errorContext, messages.length, sendMessage, userMetadata]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input, errorContext, userMetadata);
    setInput('');
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message, errorContext, userMetadata);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[550px] max-h-[calc(100vh-100px)] flex flex-col rounded-2xl shadow-2xl bg-card border overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{
          background: 'linear-gradient(135deg, hsl(265, 89%, 58%) 0%, hsl(330, 85%, 60%) 100%)',
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span className="font-semibold">Bloobot</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
            onClick={() => {
              clearMessages();
            }}
            title="Nueva conversación"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
            onClick={onClose}
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="py-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && !errorContext && (
            <>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(265, 89%, 58%) 0%, hsl(330, 85%, 60%) 100%)',
                  }}
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg rounded-tl-none p-3">
                  <p className="text-sm">
                    👋 ¡Hola! Soy <strong>Bloobot</strong>, tu asistente de soporte.
                    ¿En qué puedo ayudarte hoy?
                  </p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="space-y-2 pt-2">
                {QUICK_ACTIONS.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.message)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-left group"
                  >
                    <action.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm group-hover:text-primary transition-colors">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Direct support links */}
              <div className="pt-3 border-t space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium mb-2">¿Prefieres contacto directo?</p>
                {SUPPORT_LINKS.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                  >
                    <link.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {link.label}
                    </span>
                  </a>
                ))}
              </div>
            </>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              {message.role === 'assistant' && (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(265, 89%, 58%) 0%, hsl(330, 85%, 60%) 100%)',
                  }}
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "flex-1 rounded-lg p-3 max-w-[85%]",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-none ml-auto"
                    : "bg-muted/50 rounded-tl-none"
                )}
              >
                {message.role === 'assistant' ? (
                  <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, hsl(265, 89%, 58%) 0%, hsl(330, 85%, 60%) 100%)',
                }}
              >
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted/50 rounded-lg rounded-tl-none p-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            style={{
              background: input.trim() && !isLoading 
                ? 'linear-gradient(135deg, hsl(265, 89%, 58%) 0%, hsl(330, 85%, 60%) 100%)'
                : undefined,
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
