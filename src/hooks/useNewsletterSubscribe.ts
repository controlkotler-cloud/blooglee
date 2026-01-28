import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscribeResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function useNewsletterSubscribe() {
  const [isLoading, setIsLoading] = useState(false);

  const subscribe = async (email: string, source: string = "blog"): Promise<SubscribeResult> => {
    if (!email || !email.includes("@")) {
      toast.error("Por favor, introduce un email válido");
      return { success: false, error: "Email inválido" };
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email, source },
      });

      if (error) {
        throw new Error(error.message || "Error al suscribirse");
      }

      if (data?.success) {
        toast.success(data.message || "¡Gracias por suscribirte!");
        return { success: true, message: data.message };
      } else {
        throw new Error(data?.error || "Error desconocido");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al suscribirse";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscribe,
    isLoading,
  };
}
