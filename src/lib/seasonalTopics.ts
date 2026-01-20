export interface SeasonalTopic {
  tema: string;
  keywords: string[];
  pexels_query: string;
}

// Queries optimizados para contexto farmacéutico - términos suaves y profesionales
export const SEASONAL_TOPICS: Record<number, SeasonalTopic[]> = {
  1: [
    { tema: "Propósitos saludables de año nuevo", keywords: ["hábitos saludables", "vitaminas", "detox", "ejercicio"], pexels_query: "pharmacy wellness vitamins healthy morning" },
    { tema: "Combatir la gripe y resfriados de invierno", keywords: ["sistema inmune", "vitamina C", "propóleo"], pexels_query: "herbal tea lemon honey wellness" },
    { tema: "Cuidado de la piel en invierno", keywords: ["hidratación", "cremas", "labios agrietados"], pexels_query: "skincare cream moisturizer beauty" },
    { tema: "Blue Monday: cuidar la salud mental", keywords: ["ánimo", "vitamina D", "bienestar emocional"], pexels_query: "calm relaxation meditation peaceful" },
    { tema: "Recuperarse de los excesos navideños", keywords: ["digestión", "hígado", "probióticos"], pexels_query: "healthy food vegetables fruits nutrition" }
  ],
  2: [
    { tema: "Alergias de invierno y calefacción", keywords: ["humidificadores", "piel seca", "alergias ácaros"], pexels_query: "cozy home wellness comfortable living" },
    { tema: "San Valentín: cosmética y cuidado personal", keywords: ["perfumes", "cosmética", "regalo pareja"], pexels_query: "beauty cosmetics skincare products" },
    { tema: "Preparar el cuerpo para la primavera", keywords: ["depuración", "energía", "complementos"], pexels_query: "spring wellness nature fresh healthy" },
    { tema: "Carnaval: maquillaje y cuidado de la piel", keywords: ["desmaquillantes", "piel sensible"], pexels_query: "skincare beauty routine facial care" },
    { tema: "Salud cardiovascular", keywords: ["colesterol", "omega 3", "corazón sano"], pexels_query: "healthy heart walking wellness" }
  ],
  3: [
    { tema: "Alergias primaverales: preparación y prevención", keywords: ["antihistamínicos", "polen", "conjuntivitis"], pexels_query: "spring garden flowers peaceful" },
    { tema: "Cambio de hora y su efecto en el sueño", keywords: ["melatonina", "insomnio", "ritmo circadiano"], pexels_query: "peaceful sleep bedroom rest calm" },
    { tema: "Detox primaveral", keywords: ["depurativo", "hígado", "drenante"], pexels_query: "green juice smoothie healthy detox" },
    { tema: "Día del padre: cuidado masculino", keywords: ["afeitado", "cosmética hombre", "regalo"], pexels_query: "men grooming care wellness" },
    { tema: "Astenia primaveral: combatir el cansancio", keywords: ["jalea real", "ginseng", "energía"], pexels_query: "morning energy vitality wellness" }
  ],
  4: [
    { tema: "Alergias en plena primavera", keywords: ["polen", "rinitis", "colirios"], pexels_query: "spring nature wellness outdoor peaceful" },
    { tema: "Preparar la piel para el sol", keywords: ["protección solar", "vitamina E", "antioxidantes"], pexels_query: "sunscreen skincare protection beauty" },
    { tema: "Semana Santa: botiquín de viaje", keywords: ["primeros auxilios", "medicamentos viaje"], pexels_query: "travel preparation wellness organized" },
    { tema: "Cuidado del cabello en primavera", keywords: ["caída cabello", "biotina", "champús"], pexels_query: "hair care healthy beauty treatment" },
    { tema: "Salud digestiva y probióticos", keywords: ["flora intestinal", "digestión", "prebióticos"], pexels_query: "yogurt probiotics healthy food nutrition" }
  ],
  5: [
    { tema: "Día de la madre: belleza y bienestar", keywords: ["cosmética", "regalo", "antiedad"], pexels_query: "beauty spa wellness relaxation care" },
    { tema: "Operación bikini saludable", keywords: ["nutrición", "complementos", "ejercicio"], pexels_query: "healthy lifestyle walking wellness" },
    { tema: "Protección solar: guía completa", keywords: ["SPF", "fotoprotección", "melanoma"], pexels_query: "sunscreen summer skin protection care" },
    { tema: "Piernas cansadas con el calor", keywords: ["circulación", "varices", "medias compresión"], pexels_query: "legs wellness massage relaxation care" },
    { tema: "Exámenes: concentración y memoria", keywords: ["omega 3", "vitaminas B", "estrés estudiantes"], pexels_query: "study focus concentration calm desk" }
  ],
  6: [
    { tema: "Protección solar para toda la familia", keywords: ["niños sol", "after sun", "quemaduras"], pexels_query: "family outdoor summer wellness happy" },
    { tema: "Botiquín de verano", keywords: ["picaduras", "diarrea viajero", "mareo"], pexels_query: "summer travel wellness preparation" },
    { tema: "Hidratación en verano", keywords: ["sales minerales", "agua", "electrolitos"], pexels_query: "water hydration fresh summer healthy" },
    { tema: "Cuidado del cabello en verano", keywords: ["cloro", "sal", "mascarillas capilares"], pexels_query: "hair care summer beauty treatment" },
    { tema: "Hongos y piscinas: prevención", keywords: ["pie de atleta", "antifúngicos"], pexels_query: "swimming wellness summer healthy" }
  ],
  7: [
    { tema: "Viajes y salud: preparación completa", keywords: ["vacunas", "botiquín viaje", "jet lag"], pexels_query: "travel vacation preparation wellness" },
    { tema: "Golpes de calor: prevención y actuación", keywords: ["hidratación", "ancianos", "niños"], pexels_query: "summer cool water hydration fresh" },
    { tema: "Cuidado de la piel tras el sol", keywords: ["after sun", "aloe vera", "hidratación"], pexels_query: "aloe vera skincare natural care" },
    { tema: "Alimentación saludable en verano", keywords: ["frutas", "ensaladas", "digestiones"], pexels_query: "summer fruits salad healthy food" },
    { tema: "Piernas ligeras en verano", keywords: ["retención líquidos", "calor", "circulación"], pexels_query: "legs wellness summer relaxation care" }
  ],
  8: [
    { tema: "Mantener la rutina saludable en vacaciones", keywords: ["ejercicio verano", "alimentación"], pexels_query: "vacation wellness healthy lifestyle" },
    { tema: "Cuidado de los ojos en verano", keywords: ["gafas sol", "sequedad ocular", "conjuntivitis"], pexels_query: "sunglasses summer eye care protection" },
    { tema: "Picaduras de insectos: prevención y tratamiento", keywords: ["mosquitos", "medusas", "repelentes"], pexels_query: "summer outdoor nature wellness" },
    { tema: "Intoxicaciones alimentarias en verano", keywords: ["gastroenteritis", "probióticos"], pexels_query: "food safety kitchen healthy" },
    { tema: "Preparar la vuelta al cole", keywords: ["vitaminas niños", "piojos", "revisiones"], pexels_query: "school children healthy happy books" }
  ],
  9: [
    { tema: "Vuelta al cole saludable", keywords: ["sistema inmune niños", "mochilas", "piojos"], pexels_query: "school children healthy backpack" },
    { tema: "Recuperar la piel tras el verano", keywords: ["manchas sol", "hidratación", "peeling"], pexels_query: "skincare facial treatment beauty" },
    { tema: "Caída del cabello otoñal", keywords: ["biotina", "hierro", "champús anticaída"], pexels_query: "hair care autumn beauty treatment" },
    { tema: "Retomar rutinas saludables", keywords: ["ejercicio", "alimentación", "sueño"], pexels_query: "healthy routine morning wellness" },
    { tema: "Síndrome postvacacional", keywords: ["estrés", "adaptación", "ánimo"], pexels_query: "work balance wellness calm office" }
  ],
  10: [
    { tema: "Preparar el sistema inmune para el otoño", keywords: ["propóleo", "equinácea", "vitamina C"], pexels_query: "autumn wellness orange vitamins" },
    { tema: "Día mundial de la salud mental", keywords: ["ansiedad", "bienestar emocional"], pexels_query: "mental health calm meditation peaceful" },
    { tema: "Cuidado de la piel en otoño", keywords: ["hidratación", "vitamina E", "sérum"], pexels_query: "skincare autumn beauty cream" },
    { tema: "Halloween: maquillaje seguro", keywords: ["desmaquillantes", "piel sensible"], pexels_query: "skincare makeup beauty care" },
    { tema: "Cambio de hora: preparar el cuerpo", keywords: ["sueño", "melatonina", "luz natural"], pexels_query: "sleep cozy autumn rest peaceful" }
  ],
  11: [
    { tema: "Prevención de gripes y resfriados", keywords: ["vacuna gripe", "vitaminas", "defensas"], pexels_query: "winter wellness tea warm cozy" },
    { tema: "Movember: salud masculina", keywords: ["próstata", "revisiones", "cáncer"], pexels_query: "men health wellness fitness" },
    { tema: "Black Friday: ofertas en salud y belleza", keywords: ["cosmética", "productos estrella"], pexels_query: "beauty products skincare cosmetics" },
    { tema: "Cuidado de labios y manos en frío", keywords: ["bálsamo labial", "cremas manos"], pexels_query: "hands care cream winter beauty" },
    { tema: "Diabetes: mes de concienciación", keywords: ["glucosa", "prevención", "control"], pexels_query: "healthy food nutrition vegetables" }
  ],
  12: [
    { tema: "Preparar el cuerpo para las fiestas", keywords: ["digestión", "probióticos", "excesos"], pexels_query: "healthy food wellness nutrition" },
    { tema: "Regalos de Navidad saludables", keywords: ["cosmética", "bienestar", "sets regalo"], pexels_query: "gift beauty wellness christmas" },
    { tema: "Cuidado de la piel en invierno", keywords: ["frío", "hidratación", "protección"], pexels_query: "winter skincare cream moisturizer" },
    { tema: "Consejos para las cenas navideñas", keywords: ["digestivo", "acidez", "moderación"], pexels_query: "healthy dinner family nutrition" },
    { tema: "Propósitos saludables para el nuevo año", keywords: ["planificación", "hábitos", "salud"], pexels_query: "new year wellness healthy goals" }
  ]
};

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function getAssignedTopic(pharmacyIndex: number, month: number): SeasonalTopic {
  const monthTopics = SEASONAL_TOPICS[month] || SEASONAL_TOPICS[1];
  return monthTopics[pharmacyIndex % monthTopics.length];
}
