export const BUSINESS_TYPES = [
  {
    value: "local_business",
    label: "Negocio local",
    description: "Captación local, reputación y recurrencia",
  },
  {
    value: "b2b_services",
    label: "Empresa B2B / Servicios",
    description: "Generación de leads, autoridad y ventas complejas",
  },
  {
    value: "ecommerce",
    label: "Ecommerce / Tienda online",
    description: "SEO transaccional, categorías y conversión",
  },
  {
    value: "health_services",
    label: "Clínica / Centro de salud",
    description: "Confianza, claridad y captación de pacientes",
  },
  {
    value: "agency_consulting",
    label: "Agencia / Consultoría",
    description: "Visibilidad, posicionamiento y captación de clientes",
  },
  {
    value: "advisory_firm",
    label: "Asesoría / Despacho",
    description: "Autoridad, rigor y búsquedas con intención clara",
  },
  {
    value: "publisher_media",
    label: "Editorial / Medio",
    description: "Cobertura temática y profundidad informativa",
  },
  {
    value: "other",
    label: "Otro",
    description: "Configuración flexible con guía adicional",
  },
] as const;

export const BUSINESS_TYPE_BY_SECTOR: Record<string, string> = {
  farmacia: "local_business",
  clinica_dental: "health_services",
  restaurante: "local_business",
  peluqueria: "local_business",
  veterinaria: "health_services",
  ecommerce: "ecommerce",
  marketing: "agency_consulting",
  gimnasio: "local_business",
  asesoria: "advisory_firm",
  inmobiliaria: "b2b_services",
  otro: "other",
};

export const SECTOR_DESCRIPTION_PLACEHOLDERS: Record<string, string> = {
  farmacia:
    "Qué vendes: servicios farmacéuticos, dermofarmacia y consejo experto.\nA quién: titulares de farmacia o clientes de proximidad.\nQué problema resuelves: visibilidad, fidelización y venta de categorías clave.\nQué te diferencia: especialización, cercanía o surtido.",
  clinica_dental:
    "Qué vendes: odontología general, ortodoncia, implantes o estética dental.\nA quién: adultos y familias que buscan confianza y claridad.\nQué problema resuelves: captación de pacientes y diferenciación.\nQué te diferencia: experiencia, tecnología o trato.",
  marketing:
    "Qué vendes: SEO, contenidos, redes, branding, automatización o captación.\nA quién: empresas que toman decisiones de marketing.\nQué problema resuelves: visibilidad, leads y crecimiento.\nQué te diferencia: especialización sectorial, metodología o resultados.",
};

export const DEFAULT_DESCRIPTION_PLACEHOLDER =
  "Qué vendes:\nA quién se lo vendes:\nQué problema principal resuelves:\nQué te diferencia:";

export const SECTOR_AUDIENCE_PLACEHOLDER: Record<string, string> = {
  farmacia:
    "Perfil/cargo: titulares de farmacia y responsables de negocio.\nObjetivo: aumentar visibilidad, fidelización o ticket medio.\nProblema: poca diferenciación, estacionalidad, competencia local.\nQué valora: claridad, rentabilidad y acciones aplicables.",
  marketing:
    "Perfil/cargo: CEO, director de marketing o responsable comercial.\nTipo de negocio: pyme o empresa en crecimiento.\nObjetivo: captar leads y mejorar visibilidad.\nProblema: dependencia de referencias, poca tracción orgánica.\nQué valora: estrategia, resultados y especialización.",
  asesoria:
    "Perfil/cargo: autónomos, gerencia o administración.\nObjetivo: tomar mejores decisiones y reducir errores.\nProblema: incertidumbre fiscal, laboral o contable.\nQué valora: rigor, claridad y utilidad práctica.",
};

export const DEFAULT_AUDIENCE_PLACEHOLDER =
  "Perfil/cargo:\nTipo de negocio o situación:\nObjetivo principal:\nProblema principal:\nQué valora al decidir:";

export const SECTOR_GOAL_PLACEHOLDER: Record<string, string> = {
  farmacia:
    "Ej: Queremos atraer búsquedas relacionadas con campañas estacionales, categorías de alta rotación y acciones para mejorar visibilidad y ticket medio de la farmacia.",
  marketing:
    "Ej: Queremos atraer búsquedas con intención comercial sobre SEO, automatización, visibilidad y captación de leads para vender servicios.",
  asesoria:
    "Ej: Queremos posicionarnos como referencia práctica en fiscalidad, laboral y gestión para pymes, y convertir visitas en contactos cualificados.",
};

export const DEFAULT_GOAL_PLACEHOLDER =
  "Ej: Queremos atraer búsquedas útiles para nuestro negocio, demostrar autoridad y convertir lectores en oportunidades comerciales.";

export const SECTOR_PRIORITY_TOPICS_PLACEHOLDER: Record<string, string> = {
  farmacia:
    "Ej: campañas estacionales, categorías con mayor margen, escaparate, visibilidad local, fidelización, experiencia en farmacia",
  marketing:
    "Ej: SEO, contenidos, automatización, captación, reputación online, diferenciación, analítica",
  restaurante:
    "Ej: reservas, carta digital, ticket medio, menús estacionales, reseñas, fidelización",
};

export const DEFAULT_PRIORITY_TOPICS_PLACEHOLDER =
  "Ej: captación, posicionamiento local, experiencia de cliente, rentabilidad, diferenciación";

export const SECTOR_AVOID_PLACEHOLDER: Record<string, string> = {
  farmacia: "Ej: precios exactos, diagnósticos, recomendaciones terapéuticas, competencia directa",
  clinica_dental: "Ej: promesas de resultados, precios cerrados, diagnósticos sin consulta",
  restaurante: "Ej: críticas a competidores, recetas literales con copyright, política",
  peluqueria: "Ej: promesas médicas, productos peligrosos, comparativas contra competidores",
  gimnasio: "Ej: esteroides, dietas extremas, promesas irreales",
  veterinaria: "Ej: automedicación, diagnósticos sin visita, tratamientos concretos",
  inmobiliaria: "Ej: predicciones tajantes de precios, zonas conflictivas, política",
  asesoria: "Ej: evasión fiscal, asesoramiento legal cerrado, comparativas agresivas",
  ecommerce: "Ej: promesas garantizadas, copiar catálogos, comparativas directas con competidores",
  marketing: "Ej: spam, resultados garantizados, ataques a competidores",
};

export const DEFAULT_AVOID_PLACEHOLDER =
  "Ej: temas delicados, promesas que no quieres hacer, enfoques que dañan tu marca";

export const SECTOR_ANGLE_TO_AVOID_PLACEHOLDER: Record<string, string> = {
  farmacia:
    "Ej: No queremos artículos clínicos ni orientados al paciente final. Si se habla de campañas o categorías, debe ser desde negocio, comunicación y experiencia de cliente.",
  marketing:
    "Ej: No queremos teoría vacía ni contenido para principiantes absolutos. Debe tener aplicación práctica y foco en negocio.",
  asesoria:
    "Ej: No queremos respuestas cerradas sobre casos concretos ni interpretaciones legales tajantes. Debe ser informativo y prudente.",
};

export const DEFAULT_ANGLE_TO_AVOID_PLACEHOLDER =
  "Ej: No queremos un enfoque demasiado técnico, clínico, agresivo o dirigido al cliente equivocado.";

export const SECTOR_PREFERRED_SOURCES_PLACEHOLDER: Record<string, string> = {
  farmacia: "Ej: aemps.gob.es, farmaceuticos.com, sanidad.gob.es",
  marketing: "Ej: search.google.com, developers.google.com, thinkwithgoogle.com, iabspain.es",
  asesoria: "Ej: agenciatributaria.es, seg-social.es, boe.es",
};

export const DEFAULT_PREFERRED_SOURCES_PLACEHOLDER =
  "Ej: ine.es, camara.es, search.google.com";

export function getDefaultBusinessType(sector?: string | null): string {
  if (!sector) return "other";
  return BUSINESS_TYPE_BY_SECTOR[sector] || "other";
}

export function getStructuredDescriptionPlaceholder(sector?: string | null): string {
  if (!sector) return DEFAULT_DESCRIPTION_PLACEHOLDER;
  return SECTOR_DESCRIPTION_PLACEHOLDERS[sector] || DEFAULT_DESCRIPTION_PLACEHOLDER;
}

export function getAudiencePlaceholder(sector?: string | null): string {
  if (!sector) return DEFAULT_AUDIENCE_PLACEHOLDER;
  return SECTOR_AUDIENCE_PLACEHOLDER[sector] || DEFAULT_AUDIENCE_PLACEHOLDER;
}

export function getContentGoalPlaceholder(sector?: string | null): string {
  if (!sector) return DEFAULT_GOAL_PLACEHOLDER;
  return SECTOR_GOAL_PLACEHOLDER[sector] || DEFAULT_GOAL_PLACEHOLDER;
}

export function getPriorityTopicsPlaceholder(sector?: string | null): string {
  if (!sector) return DEFAULT_PRIORITY_TOPICS_PLACEHOLDER;
  return SECTOR_PRIORITY_TOPICS_PLACEHOLDER[sector] || DEFAULT_PRIORITY_TOPICS_PLACEHOLDER;
}

export function getAvoidTopicsPlaceholder(sector?: string | null): string {
  if (!sector) return DEFAULT_AVOID_PLACEHOLDER;
  return SECTOR_AVOID_PLACEHOLDER[sector] || DEFAULT_AVOID_PLACEHOLDER;
}

export function getAngleToAvoidPlaceholder(sector?: string | null): string {
  if (!sector) return DEFAULT_ANGLE_TO_AVOID_PLACEHOLDER;
  return SECTOR_ANGLE_TO_AVOID_PLACEHOLDER[sector] || DEFAULT_ANGLE_TO_AVOID_PLACEHOLDER;
}

export function getPreferredSourcesPlaceholder(sector?: string | null): string {
  if (!sector) return DEFAULT_PREFERRED_SOURCES_PLACEHOLDER;
  return SECTOR_PREFERRED_SOURCES_PLACEHOLDER[sector] || DEFAULT_PREFERRED_SOURCES_PLACEHOLDER;
}

export function getBusinessTypeWarning(businessType?: string | null, audience?: string | null): string | null {
  if (!businessType || !audience) return null;
  const normalized = audience.toLowerCase();
  if (
    businessType === "agency_consulting" &&
    /(pacientes|consumidores|cliente final|usuarios finales|tecnicos|adjuntos)/i.test(normalized)
  ) {
    return "Tu audiencia parece describir al cliente final, no al decisor que contrata tus servicios. Eso suele empeorar la precisión de los temas.";
  }
  return null;
}

export function getSeasonalWarning(businessType?: string | null, pillars?: string[] | null): string | null {
  if (!businessType || !pillars?.includes("seasonal")) return null;
  if (businessType === "agency_consulting" || businessType === "b2b_services") {
    return "Con contenido estacional en servicios B2B, define bien el enfoque para evitar artículos que se vayan al producto o al cliente final.";
  }
  return null;
}
