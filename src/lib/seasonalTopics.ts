export interface SeasonalTopic {
  tema: string;
  keywords: string[];
  pexels_query: string;
}

export const SEASONAL_TOPICS: Record<number, SeasonalTopic[]> = {
  1: [
    { tema: "Propósitos saludables de año nuevo", keywords: ["hábitos saludables", "vitaminas", "detox", "ejercicio"], pexels_query: "healthy lifestyle new year" },
    { tema: "Combatir la gripe y resfriados de invierno", keywords: ["sistema inmune", "vitamina C", "propóleo"], pexels_query: "winter health tea warm" },
    { tema: "Cuidado de la piel en invierno", keywords: ["hidratación", "cremas", "labios agrietados"], pexels_query: "skincare winter moisturizer" },
    { tema: "Blue Monday: cuidar la salud mental", keywords: ["ánimo", "vitamina D", "bienestar emocional"], pexels_query: "mental health wellness calm" },
    { tema: "Recuperarse de los excesos navideños", keywords: ["digestión", "hígado", "probióticos"], pexels_query: "healthy food detox vegetables" }
  ],
  2: [
    { tema: "Alergias de invierno y calefacción", keywords: ["humidificadores", "piel seca", "alergias ácaros"], pexels_query: "home comfort winter cozy" },
    { tema: "San Valentín: cosmética y cuidado personal", keywords: ["perfumes", "cosmética", "regalo pareja"], pexels_query: "beauty cosmetics self care" },
    { tema: "Preparar el cuerpo para la primavera", keywords: ["depuración", "energía", "complementos"], pexels_query: "spring energy nature fresh" },
    { tema: "Carnaval: maquillaje y cuidado de la piel", keywords: ["desmaquillantes", "piel sensible"], pexels_query: "makeup beauty skincare" },
    { tema: "Salud cardiovascular", keywords: ["colesterol", "omega 3", "corazón sano"], pexels_query: "heart health exercise running" }
  ],
  3: [
    { tema: "Alergias primaverales: preparación y prevención", keywords: ["antihistamínicos", "polen", "conjuntivitis"], pexels_query: "spring flowers nature bloom" },
    { tema: "Cambio de hora y su efecto en el sueño", keywords: ["melatonina", "insomnio", "ritmo circadiano"], pexels_query: "sleep rest bedroom peaceful" },
    { tema: "Detox primaveral", keywords: ["depurativo", "hígado", "drenante"], pexels_query: "detox juice healthy green" },
    { tema: "Día del padre: cuidado masculino", keywords: ["afeitado", "cosmética hombre", "regalo"], pexels_query: "men grooming self care" },
    { tema: "Astenia primaveral: combatir el cansancio", keywords: ["jalea real", "ginseng", "energía"], pexels_query: "energy vitality morning sunshine" }
  ],
  4: [
    { tema: "Alergias en plena primavera", keywords: ["polen", "rinitis", "colirios"], pexels_query: "spring outdoor nature wellness" },
    { tema: "Preparar la piel para el sol", keywords: ["protección solar", "vitamina E", "antioxidantes"], pexels_query: "sun protection summer skin" },
    { tema: "Semana Santa: botiquín de viaje", keywords: ["primeros auxilios", "medicamentos viaje"], pexels_query: "travel vacation suitcase" },
    { tema: "Cuidado del cabello en primavera", keywords: ["caída cabello", "biotina", "champús"], pexels_query: "hair care healthy shiny" },
    { tema: "Salud digestiva y probióticos", keywords: ["flora intestinal", "digestión", "prebióticos"], pexels_query: "healthy gut food yogurt" }
  ],
  5: [
    { tema: "Día de la madre: belleza y bienestar", keywords: ["cosmética", "regalo", "antiedad"], pexels_query: "beauty wellness spa relaxation" },
    { tema: "Operación bikini saludable", keywords: ["nutrición", "complementos", "ejercicio"], pexels_query: "fitness healthy lifestyle exercise" },
    { tema: "Protección solar: guía completa", keywords: ["SPF", "fotoprotección", "melanoma"], pexels_query: "sunscreen beach summer protection" },
    { tema: "Piernas cansadas con el calor", keywords: ["circulación", "varices", "medias compresión"], pexels_query: "legs wellness massage relaxation" },
    { tema: "Exámenes: concentración y memoria", keywords: ["omega 3", "vitaminas B", "estrés estudiantes"], pexels_query: "study focus concentration books" }
  ],
  6: [
    { tema: "Protección solar para toda la familia", keywords: ["niños sol", "after sun", "quemaduras"], pexels_query: "family beach summer sun" },
    { tema: "Botiquín de verano", keywords: ["picaduras", "diarrea viajero", "mareo"], pexels_query: "summer travel health vacation" },
    { tema: "Hidratación en verano", keywords: ["sales minerales", "agua", "electrolitos"], pexels_query: "hydration water summer fresh" },
    { tema: "Cuidado del cabello en verano", keywords: ["cloro", "sal", "mascarillas capilares"], pexels_query: "summer hair beach care" },
    { tema: "Hongos y piscinas: prevención", keywords: ["pie de atleta", "antifúngicos"], pexels_query: "swimming pool summer feet" }
  ],
  7: [
    { tema: "Viajes y salud: preparación completa", keywords: ["vacunas", "botiquín viaje", "jet lag"], pexels_query: "travel airplane vacation healthy" },
    { tema: "Golpes de calor: prevención y actuación", keywords: ["hidratación", "ancianos", "niños"], pexels_query: "summer heat cool water" },
    { tema: "Cuidado de la piel tras el sol", keywords: ["after sun", "aloe vera", "hidratación"], pexels_query: "after sun aloe skincare" },
    { tema: "Alimentación saludable en verano", keywords: ["frutas", "ensaladas", "digestiones"], pexels_query: "summer fruits healthy salad" },
    { tema: "Piernas ligeras en verano", keywords: ["retención líquidos", "calor", "circulación"], pexels_query: "legs summer beach wellness" }
  ],
  8: [
    { tema: "Mantener la rutina saludable en vacaciones", keywords: ["ejercicio verano", "alimentación"], pexels_query: "vacation fitness healthy lifestyle" },
    { tema: "Cuidado de los ojos en verano", keywords: ["gafas sol", "sequedad ocular", "conjuntivitis"], pexels_query: "sunglasses eyes summer protection" },
    { tema: "Picaduras de insectos: prevención y tratamiento", keywords: ["mosquitos", "medusas", "repelentes"], pexels_query: "summer outdoor nature protection" },
    { tema: "Intoxicaciones alimentarias en verano", keywords: ["gastroenteritis", "probióticos"], pexels_query: "food safety summer kitchen" },
    { tema: "Preparar la vuelta al cole", keywords: ["vitaminas niños", "piojos", "revisiones"], pexels_query: "back to school children healthy" }
  ],
  9: [
    { tema: "Vuelta al cole saludable", keywords: ["sistema inmune niños", "mochilas", "piojos"], pexels_query: "school children healthy happy" },
    { tema: "Recuperar la piel tras el verano", keywords: ["manchas sol", "hidratación", "peeling"], pexels_query: "skincare autumn facial treatment" },
    { tema: "Caída del cabello otoñal", keywords: ["biotina", "hierro", "champús anticaída"], pexels_query: "hair autumn care healthy" },
    { tema: "Retomar rutinas saludables", keywords: ["ejercicio", "alimentación", "sueño"], pexels_query: "healthy routine exercise morning" },
    { tema: "Síndrome postvacacional", keywords: ["estrés", "adaptación", "ánimo"], pexels_query: "work life balance wellness" }
  ],
  10: [
    { tema: "Preparar el sistema inmune para el otoño", keywords: ["propóleo", "equinácea", "vitamina C"], pexels_query: "autumn immunity healthy orange" },
    { tema: "Día mundial de la salud mental", keywords: ["ansiedad", "bienestar emocional"], pexels_query: "mental health calm meditation" },
    { tema: "Cuidado de la piel en otoño", keywords: ["hidratación", "vitamina E", "sérum"], pexels_query: "autumn skincare moisturizer beauty" },
    { tema: "Halloween: maquillaje seguro", keywords: ["desmaquillantes", "piel sensible"], pexels_query: "makeup beauty cosmetics care" },
    { tema: "Cambio de hora: preparar el cuerpo", keywords: ["sueño", "melatonina", "luz natural"], pexels_query: "sleep autumn cozy rest" }
  ],
  11: [
    { tema: "Prevención de gripes y resfriados", keywords: ["vacuna gripe", "vitaminas", "defensas"], pexels_query: "winter health immunity warm" },
    { tema: "Movember: salud masculina", keywords: ["próstata", "revisiones", "cáncer"], pexels_query: "men health fitness wellness" },
    { tema: "Black Friday: ofertas en salud y belleza", keywords: ["cosmética", "productos estrella"], pexels_query: "beauty products skincare shopping" },
    { tema: "Cuidado de labios y manos en frío", keywords: ["bálsamo labial", "cremas manos"], pexels_query: "winter hands lips care cream" },
    { tema: "Diabetes: mes de concienciación", keywords: ["glucosa", "prevención", "control"], pexels_query: "healthy food diabetes prevention" }
  ],
  12: [
    { tema: "Preparar el cuerpo para las fiestas", keywords: ["digestión", "probióticos", "excesos"], pexels_query: "christmas healthy celebration" },
    { tema: "Regalos de Navidad saludables", keywords: ["cosmética", "bienestar", "sets regalo"], pexels_query: "christmas gift beauty wellness" },
    { tema: "Cuidado de la piel en invierno", keywords: ["frío", "hidratación", "protección"], pexels_query: "winter skincare cold weather" },
    { tema: "Consejos para las cenas navideñas", keywords: ["digestivo", "acidez", "moderación"], pexels_query: "christmas dinner healthy family" },
    { tema: "Propósitos saludables para el nuevo año", keywords: ["planificación", "hábitos", "salud"], pexels_query: "new year goals healthy lifestyle" }
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
