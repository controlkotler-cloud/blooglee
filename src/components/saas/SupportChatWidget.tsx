import { useState, createContext, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { SupportChatDialog } from './SupportChatDialog';
import { useAuth } from '@/hooks/useAuth';

interface ErrorContext {
  code?: number | string;
  action?: string;
  message?: string;
  siteId?: string;
}

interface ChatContextValue {
  openChat: (errorContext?: ErrorContext) => void;
  closeChat: () => void;
  isOpen: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatWidget() {
  const context = useContext(ChatContext);
  if (!context) {
    // Return a no-op when outside the provider (public pages)
    return { openChat: () => {}, closeChat: () => {}, isOpen: false };
  }
  return context;
}

// Hidden routes where Bloobot should not appear
const HIDDEN_ROUTES = ['/onboarding', '/auth', '/mkpro'];

export function SupportChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [errorContext, setErrorContext] = useState<ErrorContext | undefined>();
  const { user } = useAuth();
  const location = useLocation();

  const openChat = useCallback((context?: ErrorContext) => {
    setErrorContext(context);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Don't render the widget on hidden routes or for unauthenticated users
  const shouldShow = user && !HIDDEN_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <ChatContext.Provider value={{ openChat, closeChat, isOpen }}>
      {children}
      {shouldShow && (
        <SupportChatWidget 
          isOpen={isOpen} 
          onOpenChange={setIsOpen}
          errorContext={errorContext}
        />
      )}
    </ChatContext.Provider>
  );
}

interface SupportChatWidgetProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  errorContext?: ErrorContext;
}

export function SupportChatWidget({ isOpen: controlledOpen, onOpenChange, errorContext }: SupportChatWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl"
          style={{
            background: 'linear-gradient(135deg, hsl(265, 89%, 58%) 0%, hsl(330, 85%, 60%) 100%)',
          }}
          aria-label="Abrir asistente de soporte"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat dialog */}
      <SupportChatDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        errorContext={errorContext}
      />
    </>
  );
}
