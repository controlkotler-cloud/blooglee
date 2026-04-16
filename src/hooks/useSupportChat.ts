import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ErrorContext {
  code?: number | string;
  action?: string;
  message?: string;
  siteId?: string;
}

interface UserMetadata {
  userId?: string;
  plan?: string;
  sitesCount?: number;
  email?: string;
  registeredAt?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chatbot`;

function extractTextFromContentNode(node: unknown): string {
  if (typeof node === "string") return node;
  if (!node) return "";

  if (Array.isArray(node)) {
    return node
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const rec = item as Record<string, unknown>;
          if (typeof rec.text === "string") return rec.text;
          if (typeof rec.content === "string") return rec.content;
        }
        return "";
      })
      .filter(Boolean)
      .join("");
  }

  if (node && typeof node === "object") {
    const rec = node as Record<string, unknown>;
    if (typeof rec.text === "string") return rec.text;
    if (typeof rec.content === "string") return rec.content;
  }

  return "";
}

function extractAssistantContent(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as Record<string, unknown>;

  const directContent = extractTextFromContentNode(root.content);
  if (directContent) return directContent;

  const outputText = extractTextFromContentNode(root.output_text);
  if (outputText) return outputText;

  const choices = root.choices;
  if (Array.isArray(choices)) {
    for (const choice of choices) {
      if (!choice || typeof choice !== "object") continue;
      const rec = choice as Record<string, unknown>;

      const deltaText = extractTextFromContentNode((rec.delta as Record<string, unknown> | undefined)?.content);
      if (deltaText) return deltaText;

      const messageText = extractTextFromContentNode((rec.message as Record<string, unknown> | undefined)?.content);
      if (messageText) return messageText;

      const text = extractTextFromContentNode(rec.text);
      if (text) return text;
    }
  }

  return "";
}

export function useSupportChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { session } = useAuth();

  // Cleanup: abort any pending request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback(
    async (userMessage: string, errorContext?: ErrorContext, userMetadata?: UserMetadata) => {
      if (isLoading) return;
      if (!userMessage.trim()) return;

      setError(null);
      const userMsg: Message = { role: "user", content: userMessage };
      const requestMessages = [...messages, userMsg];
      setMessages(requestMessages);
      setIsLoading(true);

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      let assistantContent = "";
      const upsertAssistantMessage = (content: string) => {
        if (!content.trim()) return;
        assistantContent = content;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
          }
          return [...prev, { role: "assistant", content: assistantContent }];
        });
      };

      try {
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: session?.access_token
              ? `Bearer ${session.access_token}`
              : `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: requestMessages,
            error_context: errorContext,
            user_metadata: userMetadata,
            conversation_id: conversationId || undefined,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          let parsedError = "";
          if (errorBody) {
            try {
              const parsed = JSON.parse(errorBody) as Record<string, unknown>;
              parsedError = typeof parsed.error === "string" ? parsed.error : "";
            } catch {
              parsedError = "";
            }
          }
          if (response.status === 429) {
            throw new Error("Demasiadas peticiones. Por favor, espera un momento.");
          }
          if (response.status === 402) {
            throw new Error("Límite de servicio alcanzado. Contacta con soporte.");
          }
          throw new Error(parsedError || "Error al conectar con el asistente");
        }

        const returnedConversationId = response.headers.get("x-conversation-id");
        if (returnedConversationId) {
          setConversationId(returnedConversationId);
        }

        const contentType = (response.headers.get("content-type") || "").toLowerCase();

        if (!response.body || !contentType.includes("text/event-stream")) {
          const raw = await response.text().catch(() => "");
          let nonStreamContent = "";

          if (raw) {
            try {
              nonStreamContent = extractAssistantContent(JSON.parse(raw));
            } catch {
              nonStreamContent = raw.trim();
            }
          }

          if (!nonStreamContent) {
            throw new Error("No se pudo interpretar la respuesta del asistente");
          }

          upsertAssistantMessage(nonStreamContent);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let rawBuffer = "";
        let doneReceived = false;

        while (!doneReceived) {
          const { done, value } = await reader.read();
          if (done) break;

          const decodedChunk = decoder.decode(value, { stream: true });
          textBuffer += decodedChunk;
          rawBuffer += decodedChunk;

          // Process SSE lines
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              doneReceived = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = extractAssistantContent(parsed);
              if (content) {
                upsertAssistantMessage(assistantContent + content);
              }
            } catch {
              // Incomplete JSON, put back and wait
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = extractAssistantContent(parsed);
              if (content) {
                upsertAssistantMessage(assistantContent + content);
              }
            } catch {
              /* ignore */
            }
          }
        }

        if (!assistantContent.trim() && rawBuffer.trim()) {
          try {
            const parsedRaw = JSON.parse(rawBuffer);
            const fallbackContent = extractAssistantContent(parsedRaw);
            if (fallbackContent) {
              upsertAssistantMessage(fallbackContent);
            }
          } catch {
            // ignore
          }
        }

        if (!assistantContent.trim()) {
          upsertAssistantMessage(
            "No he podido generar una respuesta útil en este intento. Vuelve a intentarlo y si persiste, te ayudo a escalarlo a soporte.",
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Chat error:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev;
          return [
            ...prev,
            {
              role: "assistant",
              content:
                "Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo o contacta con soporte@blooglee.com",
            },
          ];
        });
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, conversationId, isLoading, session?.access_token],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    cancelRequest,
  };
}
