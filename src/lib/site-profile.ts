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
  farmacia: "Resume tu negocio en 2-4 lineas: que ofreces, para quien y que te diferencia.",
  clinica_dental: "Resume tu negocio en 2-4 lineas: servicios, tipo de paciente y valor diferencial.",
  marketing: "Resume tu negocio en 2-4 lineas: servicios, cliente ideal y propuesta de valor.",
};

export const DEFAULT_DESCRIPTION_PLACEHOLDER =
  "Resume tu negocio en 2-4 lineas: que haces, para quien y por que te eligen.";

export const SECTOR_DESCRIPTION_EXAMPLES: Record<string, string> = {
  farmacia:
    "Farmacia comunitaria con foco en dermofarmacia y consejo personalizado para mejorar fidelizacion y ticket medio.",
  clinica_dental:
    "Clinica dental especializada en ortodoncia e implantologia, orientada a pacientes que buscan trato cercano y resultados sostenibles.",
  marketing:
    "Agencia de marketing enfocada en SEO y contenidos para pymes que quieren captar leads cualificados y crecer de forma rentable.",
};

export const DEFAULT_DESCRIPTION_EXAMPLE =
  "Empresa de servicios especializada en ayudar a su cliente ideal a mejorar visibilidad, conversion y resultados de negocio.";

export const SECTOR_AUDIENCE_PLACEHOLDER: Record<string, string> = {
  farmacia: "Define el decisor: perfil, objetivo y problema principal.",
  marketing: "Define el decisor: cargo, objetivo y freno actual.",
  asesoria: "Define el decisor: perfil, contexto y necesidad prioritaria.",
};

export const DEFAULT_AUDIENCE_PLACEHOLDER =
  "Describe al decisor ideal: quien es, que quiere lograr y que le preocupa.";

export const SECTOR_AUDIENCE_EXAMPLES: Record<string, string> = {
  farmacia:
    "Titulares y responsables de farmacia que quieren mejorar visibilidad local, impulsar categorias clave y fidelizar clientes.",
  marketing:
    "CEO o director de marketing de pyme que busca captar demanda organica y reducir dependencia de referencias.",
  asesoria:
    "Autonomos y gerentes de pyme que necesitan claridad fiscal y laboral para tomar decisiones con menos riesgo.",
};

export const DEFAULT_AUDIENCE_EXAMPLE =
  "Responsables de negocio que buscan resultados medibles y valoran contenido practico para decidir mejor.";

export const SECTOR_GOAL_PLACEHOLDER: Record<string, string> = {
  farmacia: "Explica para que quieres el blog a nivel de negocio.",
  marketing: "Explica para que quieres el blog a nivel de negocio.",
  asesoria: "Explica para que quieres el blog a nivel de negocio.",
};

export const DEFAULT_GOAL_PLACEHOLDER =
  "Explica para que quieres el blog: trafico cualificado, autoridad, leads o ventas.";

export const SECTOR_GOAL_EXAMPLES: Record<string, string> = {
  farmacia:
    "Atraer busquedas de alta intencion sobre campanas estacionales y convertir visitas en compras recurrentes o consultas en tienda.",
  marketing:
    "Captar demanda cualificada en SEO y automatizacion para convertir lectores en oportunidades comerciales.",
  asesoria:
    "Posicionar la marca como referente en fiscal y laboral y transformar trafico organico en contactos de calidad.",
};

export const DEFAULT_GOAL_EXAMPLE =
  "Generar trafico cualificado, reforzar autoridad y convertir parte de las visitas en contactos o ventas.";

export const SECTOR_EDITORIAL_FOCUS_EXAMPLES: Record<string, string> = {
  farmacia:
    "Priorizar contenidos sobre visibilidad local, campanas de temporada, categorias estrategicas y experiencia de cliente en farmacia.",
  marketing:
    "Priorizar contenidos sobre SEO, captacion, automatizacion y estrategia editorial orientada a negocio.",
  asesoria:
    "Priorizar contenidos practicos sobre fiscalidad, laboral y gestion para resolver dudas frecuentes de pymes y autonomos.",
};

export const DEFAULT_EDITORIAL_FOCUS_EXAMPLE =
  "Priorizar temas con demanda real, enfoque practico y utilidad directa para el cliente ideal.";

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

export function getDescriptionExample(sector?: string | null): string {
  if (!sector) return DEFAULT_DESCRIPTION_EXAMPLE;
  return SECTOR_DESCRIPTION_EXAMPLES[sector] || DEFAULT_DESCRIPTION_EXAMPLE;
}

export function getAudiencePlaceholder(sector?: string | null): string {
  if (!sector) return DEFAULT_AUDIENCE_PLACEHOLDER;
  return SECTOR_AUDIENCE_PLACEHOLDER[sector] || DEFAULT_AUDIENCE_PLACEHOLDER;
}

export function getAudienceExample(sector?: string | null): string {
  if (!sector) return DEFAULT_AUDIENCE_EXAMPLE;
  return SECTOR_AUDIENCE_EXAMPLES[sector] || DEFAULT_AUDIENCE_EXAMPLE;
}

export function getContentGoalPlaceholder(sector?: string | null): string {
  if (!sector) return DEFAULT_GOAL_PLACEHOLDER;
  return SECTOR_GOAL_PLACEHOLDER[sector] || DEFAULT_GOAL_PLACEHOLDER;
}

export function getContentGoalExample(sector?: string | null): string {
  if (!sector) return DEFAULT_GOAL_EXAMPLE;
  return SECTOR_GOAL_EXAMPLES[sector] || DEFAULT_GOAL_EXAMPLE;
}

export function getEditorialFocusExample(sector?: string | null): string {
  if (!sector) return DEFAULT_EDITORIAL_FOCUS_EXAMPLE;
  return SECTOR_EDITORIAL_FOCUS_EXAMPLES[sector] || DEFAULT_EDITORIAL_FOCUS_EXAMPLE;
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
