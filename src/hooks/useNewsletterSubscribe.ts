import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscribeResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface SubscribeParams {
  name: string;
  email: string;
  audience: 'empresas' | 'agencias';
  gdprConsent: boolean;
  marketingConsent: boolean;
  source?: string;
}

export function useNewsletterSubscribe() {
  const [isLoading, setIsLoading] = useState(false);

  const subscribe = async ({
    name,
    email, 
    audience,
    gdprConsent,
    marketingConsent,
    source = "footer"
  }: SubscribeParams): Promise<SubscribeResult> => {
    // Validate required fields
    if (!name || name.trim().length < 2) {
      toast.error("Por favor, introduce tu nombre");
      return { success: false, error: "Nombre requerido" };
    }

    if (!email || !email.includes("@")) {
      toast.error("Por favor, introduce un email válido");
      return { success: false, error: "Email inválido" };
    }

    if (!['empresas', 'agencias'].includes(audience)) {
      toast.error("Selecciona si eres Empresa o Agencia");
      return { success: false, error: "Perfil requerido" };
    }

    if (!gdprConsent) {
      toast.error("Debes aceptar la política de privacidad");
      return { success: false, error: "Consentimiento GDPR requerido" };
    }

    if (!marketingConsent) {
      toast.error("Debes aceptar recibir comunicaciones");
      return { success: false, error: "Consentimiento marketing requerido" };
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { 
          name: name.trim(),
          email: email.toLowerCase().trim(), 
          audience,
          gdprConsent,
          marketingConsent,
          source 
        },
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
