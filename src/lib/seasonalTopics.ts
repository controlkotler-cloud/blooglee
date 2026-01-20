export interface SeasonalTopic {
  tema: string;
  keywords: string[];
  pexels_query: string;
}

// Queries optimizados para bienestar, naturaleza, calma - NUNCA productos farmacéuticos
// Excluir: pastillas, cápsulas, medicamentos, botes, productos específicos
export const SEASONAL_TOPICS: Record<number, SeasonalTopic[]> = {
  1: [
    { tema: "Propósitos saludables de año nuevo", keywords: ["hábitos saludables", "vitaminas", "detox", "ejercicio"], pexels_query: "morning wellness nature fresh start" },
    { tema: "Combatir la gripe y resfriados de invierno", keywords: ["sistema inmune", "vitamina C", "propóleo"], pexels_query: "herbal tea warm cozy winter comfort" },
    { tema: "Cuidado de la piel en invierno", keywords: ["hidratación", "cremas", "labios agrietados"], pexels_query: "spa beauty natural skincare woman face" },
    { tema: "Blue Monday: cuidar la salud mental", keywords: ["ánimo", "vitamina D", "bienestar emocional"], pexels_query: "calm meditation peaceful mindfulness nature" },
    { tema: "Recuperarse de los excesos navideños", keywords: ["digestión", "hígado", "probióticos"], pexels_query: "healthy food vegetables salad nutrition" },
    { tema: "Vitaminas para empezar el año con energía", keywords: ["multivitamínicos", "hierro", "energía"], pexels_query: "sunrise morning energy vitality outdoor" },
    { tema: "Sistema inmune fuerte en invierno", keywords: ["defensas", "zinc", "equinácea"], pexels_query: "winter nature forest peaceful wellness" },
    { tema: "Cuidados especiales para mayores en época de frío", keywords: ["articulaciones", "calor", "movilidad"], pexels_query: "elderly happy walking nature garden" },
    { tema: "Cosmética natural para el invierno", keywords: ["aceites naturales", "manteca karité", "cuidado facial"], pexels_query: "natural beauty botanical plants cream" },
    { tema: "Suplementos para deportistas en invierno", keywords: ["proteínas", "recuperación", "rendimiento"], pexels_query: "fitness outdoor running winter sport" },
    { tema: "Aromaterapia y bienestar emocional", keywords: ["aceites esenciales", "lavanda", "relajación"], pexels_query: "aromatherapy candles spa relaxation calm" },
    { tema: "Plantas medicinales de temporada", keywords: ["fitoterapia", "infusiones", "remedios naturales"], pexels_query: "herbal plants botanical garden green" },
    { tema: "Consejos de nutrición invernal", keywords: ["alimentación", "sopas", "vitaminas"], pexels_query: "warm soup healthy food comfort nutrition" },
    { tema: "Cuidado de bebés en invierno", keywords: ["piel bebé", "hidratación infantil", "protección"], pexels_query: "baby care gentle soft mother love" },
    { tema: "Homeopatía y medicina natural", keywords: ["remedios naturales", "bienestar", "equilibrio"], pexels_query: "natural wellness botanical herbal peaceful" }
  ],
  2: [
    { tema: "Alergias de invierno y calefacción", keywords: ["humidificadores", "piel seca", "alergias ácaros"], pexels_query: "cozy home wellness comfortable living room" },
    { tema: "San Valentín: cosmética y cuidado personal", keywords: ["perfumes", "cosmética", "regalo pareja"], pexels_query: "beauty spa romantic self care woman" },
    { tema: "Preparar el cuerpo para la primavera", keywords: ["depuración", "energía", "complementos"], pexels_query: "spring nature fresh flowers wellness" },
    { tema: "Carnaval: maquillaje y cuidado de la piel", keywords: ["desmaquillantes", "piel sensible"], pexels_query: "skincare beauty routine facial care woman" },
    { tema: "Salud cardiovascular", keywords: ["colesterol", "omega 3", "corazón sano"], pexels_query: "heart healthy walking nature outdoor" },
    { tema: "Bienestar digestivo en invierno", keywords: ["probióticos", "fibra", "digestión"], pexels_query: "healthy breakfast yogurt fruit nutrition" },
    { tema: "Cuidado del cabello en invierno", keywords: ["hidratación capilar", "puntas secas", "mascarillas"], pexels_query: "hair beauty natural care woman wellness" },
    { tema: "Alivio de dolores articulares por frío", keywords: ["articulaciones", "colágeno", "movilidad"], pexels_query: "yoga stretching wellness flexibility woman" },
    { tema: "Rutinas de belleza antienvejecimiento", keywords: ["antiedad", "colágeno", "ácido hialurónico"], pexels_query: "beauty spa facial treatment natural woman" },
    { tema: "Suplementos para el cansancio invernal", keywords: ["energía", "hierro", "fatiga"], pexels_query: "morning coffee energy vitality wellness" },
    { tema: "Cuidado de los ojos en invierno", keywords: ["sequedad ocular", "lágrimas artificiales", "protección"], pexels_query: "eyes beauty face natural woman care" },
    { tema: "Alimentación para fortalecer defensas", keywords: ["inmunidad", "superalimentos", "antioxidantes"], pexels_query: "healthy food colorful vegetables fruits" },
    { tema: "Hidratación corporal intensiva", keywords: ["piel seca", "body milk", "cuidado corporal"], pexels_query: "spa body care relaxation wellness woman" },
    { tema: "Bienestar emocional y autoestima", keywords: ["mindfulness", "autocuidado", "equilibrio"], pexels_query: "meditation peaceful calm nature woman" },
    { tema: "Preparación física para primavera", keywords: ["ejercicio", "flexibilidad", "tonificación"], pexels_query: "fitness yoga outdoor nature wellness" }
  ],
  3: [
    { tema: "Alergias primaverales: preparación y prevención", keywords: ["antihistamínicos", "polen", "conjuntivitis"], pexels_query: "spring garden flowers peaceful nature" },
    { tema: "Cambio de hora y su efecto en el sueño", keywords: ["melatonina", "insomnio", "ritmo circadiano"], pexels_query: "peaceful sleep bedroom rest calm cozy" },
    { tema: "Detox primaveral", keywords: ["depurativo", "hígado", "drenante"], pexels_query: "green smoothie healthy detox natural" },
    { tema: "Día del padre: cuidado masculino", keywords: ["afeitado", "cosmética hombre", "regalo"], pexels_query: "man grooming care wellness gentleman" },
    { tema: "Astenia primaveral: combatir el cansancio", keywords: ["jalea real", "ginseng", "energía"], pexels_query: "morning energy vitality outdoor nature" },
    { tema: "Cuidado de la piel al aire libre", keywords: ["protección solar", "hidratación", "exposición"], pexels_query: "outdoor nature spring woman wellness" },
    { tema: "Nutrición para combatir la fatiga", keywords: ["vitaminas B", "magnesio", "alimentación"], pexels_query: "healthy food nutrition breakfast energy" },
    { tema: "Ejercicio al aire libre en primavera", keywords: ["running", "senderismo", "actividad física"], pexels_query: "running outdoor spring nature exercise" },
    { tema: "Cuidado capilar primaveral", keywords: ["caída estacional", "fortalecimiento", "brillo"], pexels_query: "hair beauty spring woman nature" },
    { tema: "Bienestar respiratorio en primavera", keywords: ["mucosidad", "respiración", "limpieza nasal"], pexels_query: "fresh air nature breathing outdoor" },
    { tema: "Cosmética primaveral y renovación", keywords: ["exfoliación", "luminosidad", "renovación celular"], pexels_query: "beauty spa spring facial treatment natural" },
    { tema: "Plantas medicinales para primavera", keywords: ["ortiga", "diente de león", "depuración"], pexels_query: "herbal plants botanical spring green" },
    { tema: "Mejorar el ánimo con la llegada del buen tiempo", keywords: ["serotonina", "luz natural", "positividad"], pexels_query: "happy woman sunshine spring nature" },
    { tema: "Cuidado de manos y uñas", keywords: ["manicura", "hidratación", "uñas fuertes"], pexels_query: "hands care beauty natural woman" },
    { tema: "Equilibrio hormonal natural", keywords: ["fitoestrógenos", "bienestar femenino", "equilibrio"], pexels_query: "woman wellness balance nature peaceful" }
  ],
  4: [
    { tema: "Alergias en plena primavera", keywords: ["polen", "rinitis", "colirios"], pexels_query: "spring nature outdoor peaceful garden" },
    { tema: "Preparar la piel para el sol", keywords: ["protección solar", "vitamina E", "antioxidantes"], pexels_query: "sunlight nature beauty woman outdoor" },
    { tema: "Semana Santa: botiquín de viaje", keywords: ["primeros auxilios", "medicamentos viaje"], pexels_query: "travel nature adventure wellness outdoor" },
    { tema: "Cuidado del cabello en primavera", keywords: ["caída cabello", "biotina", "champús"], pexels_query: "hair beauty treatment natural woman" },
    { tema: "Salud digestiva y probióticos", keywords: ["flora intestinal", "digestión", "prebióticos"], pexels_query: "healthy food yogurt nutrition breakfast" },
    { tema: "Fitness y tonificación primaveral", keywords: ["ejercicio", "músculos", "definición"], pexels_query: "fitness outdoor spring exercise nature" },
    { tema: "Cosmética solar anticipada", keywords: ["autobronceador", "preparación", "melanina"], pexels_query: "beach beauty sun woman nature" },
    { tema: "Bienestar mental en primavera", keywords: ["estrés", "ansiedad", "relajación"], pexels_query: "meditation calm nature woman peaceful" },
    { tema: "Cuidado de los pies para sandalias", keywords: ["durezas", "hidratación", "pedicura"], pexels_query: "feet care beach sand nature wellness" },
    { tema: "Nutrición para la piel", keywords: ["colágeno oral", "belleza interior", "nutricosmética"], pexels_query: "beauty food healthy nutrition woman" },
    { tema: "Alivio de alergias de forma natural", keywords: ["quercetina", "vitamina C", "antiinflamatorios"], pexels_query: "nature flowers garden peaceful spring" },
    { tema: "Preparación para actividades outdoor", keywords: ["protección", "hidratación", "rendimiento"], pexels_query: "hiking outdoor adventure nature mountain" },
    { tema: "Revitalización capilar de primavera", keywords: ["tratamientos", "brillo", "nutrición"], pexels_query: "hair beauty nature woman spring" },
    { tema: "Cuidado de la piel mixta en primavera", keywords: ["equilibrio", "poros", "hidratación"], pexels_query: "skincare beauty natural face woman" },
    { tema: "Bienestar articular para deportistas", keywords: ["articulaciones", "cartílago", "recuperación"], pexels_query: "sport outdoor nature wellness active" }
  ],
  5: [
    { tema: "Día de la madre: belleza y bienestar", keywords: ["cosmética", "regalo", "antiedad"], pexels_query: "beauty spa wellness relaxation woman care" },
    { tema: "Operación bikini saludable", keywords: ["nutrición", "complementos", "ejercicio"], pexels_query: "healthy lifestyle walking beach wellness" },
    { tema: "Protección solar: guía completa", keywords: ["SPF", "fotoprotección", "melanoma"], pexels_query: "sunlight beach summer protection nature" },
    { tema: "Piernas cansadas con el calor", keywords: ["circulación", "varices", "medias compresión"], pexels_query: "legs wellness massage relaxation woman" },
    { tema: "Exámenes: concentración y memoria", keywords: ["omega 3", "vitaminas B", "estrés estudiantes"], pexels_query: "study focus calm concentration desk" },
    { tema: "Hidratación corporal pre-verano", keywords: ["firmeza", "elasticidad", "cuidado corporal"], pexels_query: "spa body wellness relaxation woman" },
    { tema: "Dieta mediterránea y bienestar", keywords: ["aceite oliva", "antioxidantes", "alimentación"], pexels_query: "mediterranean food healthy nutrition olive" },
    { tema: "Cuidado solar para niños", keywords: ["protección infantil", "piel sensible", "seguridad"], pexels_query: "children outdoor playing nature happy" },
    { tema: "Depilación y cuidado de la piel", keywords: ["post-depilación", "hidratación", "irritación"], pexels_query: "skincare beauty smooth woman care" },
    { tema: "Suplementos para el bronceado saludable", keywords: ["betacarotenos", "licopeno", "preparación"], pexels_query: "summer sun beach nature beautiful" },
    { tema: "Cuidado de los ojos en verano", keywords: ["gafas sol", "protección UV", "lágrimas"], pexels_query: "sunglasses summer woman fashion outdoor" },
    { tema: "Nutrición deportiva en primavera-verano", keywords: ["proteínas", "electrolitos", "recuperación"], pexels_query: "fitness sport outdoor nature active" },
    { tema: "Belleza natural y maquillaje ligero", keywords: ["BB cream", "look natural", "tendencias"], pexels_query: "natural beauty makeup woman face" },
    { tema: "Bienestar íntimo femenino", keywords: ["flora vaginal", "probióticos", "cuidado íntimo"], pexels_query: "woman wellness peaceful nature balance" },
    { tema: "Preparar el pelo para el verano", keywords: ["protección solar capilar", "hidratación", "brillo"], pexels_query: "hair beauty summer woman outdoor" }
  ],
  6: [
    { tema: "Protección solar para toda la familia", keywords: ["niños sol", "after sun", "quemaduras"], pexels_query: "family outdoor summer beach happy" },
    { tema: "Botiquín de verano", keywords: ["picaduras", "diarrea viajero", "mareo"], pexels_query: "summer travel beach vacation wellness" },
    { tema: "Hidratación en verano", keywords: ["sales minerales", "agua", "electrolitos"], pexels_query: "water hydration fresh summer healthy" },
    { tema: "Cuidado del cabello en verano", keywords: ["cloro", "sal", "mascarillas capilares"], pexels_query: "hair care summer beach woman beauty" },
    { tema: "Hongos y piscinas: prevención", keywords: ["pie de atleta", "antifúngicos"], pexels_query: "swimming pool summer wellness healthy" },
    { tema: "Alimentación fresca para el verano", keywords: ["ensaladas", "frutas", "hidratación"], pexels_query: "summer fruits salad fresh healthy food" },
    { tema: "Protección de la piel en la playa", keywords: ["after sun", "hidratación", "reparación"], pexels_query: "beach sunset relaxation summer nature" },
    { tema: "Cuidado de los pies en verano", keywords: ["sandalias", "durezas", "hongos"], pexels_query: "beach feet sand summer nature" },
    { tema: "Bienestar digestivo en vacaciones", keywords: ["probióticos viaje", "digestión", "prevención"], pexels_query: "travel vacation healthy food summer" },
    { tema: "Cosmética resistente al agua", keywords: ["maquillaje waterproof", "protección", "durabilidad"], pexels_query: "summer beauty woman beach outdoor" },
    { tema: "Prevención del golpe de calor", keywords: ["hidratación", "sombra", "síntomas"], pexels_query: "summer shade cool water refresh" },
    { tema: "Cuidado de bebés en verano", keywords: ["protección infantil", "hidratación bebé", "calor"], pexels_query: "baby summer outdoor nature gentle" },
    { tema: "Alivio de piernas cansadas en calor", keywords: ["circulación", "gel frío", "masaje"], pexels_query: "legs relax summer wellness woman" },
    { tema: "Nutrición para mantener la energía", keywords: ["vitaminas", "minerales", "vitalidad"], pexels_query: "healthy energy summer outdoor active" },
    { tema: "Cuidado solar para pieles sensibles", keywords: ["mineral", "hipoalergénico", "protección"], pexels_query: "sensitive skin sun protection nature" }
  ],
  7: [
    { tema: "Viajes y salud: preparación completa", keywords: ["vacunas", "botiquín viaje", "jet lag"], pexels_query: "travel vacation adventure nature beautiful" },
    { tema: "Golpes de calor: prevención y actuación", keywords: ["hidratación", "ancianos", "niños"], pexels_query: "summer cool water hydration refresh" },
    { tema: "Cuidado de la piel tras el sol", keywords: ["after sun", "aloe vera", "hidratación"], pexels_query: "aloe vera skincare natural plant care" },
    { tema: "Alimentación saludable en verano", keywords: ["frutas", "ensaladas", "digestiones"], pexels_query: "summer fruits salad healthy colorful" },
    { tema: "Piernas ligeras en verano", keywords: ["retención líquidos", "calor", "circulación"], pexels_query: "legs wellness summer beach woman" },
    { tema: "Protección ocular en verano", keywords: ["gafas sol", "UV", "sequedad"], pexels_query: "sunglasses summer fashion woman outdoor" },
    { tema: "Cuidado del cabello tras el baño", keywords: ["sal", "cloro", "reparación"], pexels_query: "hair summer beach beauty woman" },
    { tema: "Picaduras de insectos: prevención", keywords: ["repelentes", "mosquitos", "alivio"], pexels_query: "summer outdoor nature garden peaceful" },
    { tema: "Hidratación corporal intensiva verano", keywords: ["after sun", "reparación", "nutrición"], pexels_query: "body care spa summer wellness woman" },
    { tema: "Nutrición para deportistas en verano", keywords: ["electrolitos", "recuperación", "hidratación"], pexels_query: "sport summer outdoor running nature" },
    { tema: "Cuidado de la piel masculina en verano", keywords: ["aftershave", "protección", "hidratación"], pexels_query: "man summer outdoor wellness grooming" },
    { tema: "Bienestar digestivo en vacaciones", keywords: ["turista", "probióticos", "prevención"], pexels_query: "vacation travel relaxation summer nature" },
    { tema: "Cosmética minimalista de verano", keywords: ["BB cream", "ligero", "natural"], pexels_query: "natural beauty summer woman minimal" },
    { tema: "Alivio del calor para mayores", keywords: ["ancianos", "hidratación", "prevención"], pexels_query: "elderly summer garden peaceful relaxed" },
    { tema: "Cuidado de bebés y niños en verano", keywords: ["protección total", "hidratación", "calor"], pexels_query: "children summer outdoor playing happy" }
  ],
  8: [
    { tema: "Mantener la rutina saludable en vacaciones", keywords: ["ejercicio verano", "alimentación"], pexels_query: "vacation wellness healthy lifestyle outdoor" },
    { tema: "Cuidado de los ojos en verano", keywords: ["gafas sol", "sequedad ocular", "conjuntivitis"], pexels_query: "eyes beauty sunglasses summer woman" },
    { tema: "Picaduras de insectos: prevención y tratamiento", keywords: ["mosquitos", "medusas", "repelentes"], pexels_query: "summer outdoor nature peaceful garden" },
    { tema: "Intoxicaciones alimentarias en verano", keywords: ["gastroenteritis", "probióticos"], pexels_query: "food safety fresh healthy kitchen" },
    { tema: "Preparar la vuelta al cole", keywords: ["vitaminas niños", "piojos", "revisiones"], pexels_query: "children happy school books backpack" },
    { tema: "Recuperar la piel tras vacaciones", keywords: ["hidratación", "reparación", "manchas"], pexels_query: "skincare beauty spa facial treatment" },
    { tema: "Últimos días de sol: protección", keywords: ["SPF", "after sun", "cuidado"], pexels_query: "sunset beach summer beautiful nature" },
    { tema: "Preparar el cabello para el otoño", keywords: ["reparación", "hidratación", "fuerza"], pexels_query: "hair beauty treatment natural woman" },
    { tema: "Retomar hábitos saludables post-vacaciones", keywords: ["rutinas", "alimentación", "ejercicio"], pexels_query: "morning routine healthy lifestyle wellness" },
    { tema: "Cuidado de los pies tras el verano", keywords: ["durezas", "hidratación", "reparación"], pexels_query: "feet care spa wellness relaxation" },
    { tema: "Bienestar mental fin de vacaciones", keywords: ["estrés", "adaptación", "ánimo"], pexels_query: "calm relaxation nature peaceful woman" },
    { tema: "Nutrición para la vuelta a la rutina", keywords: ["energía", "vitaminas", "equilibrio"], pexels_query: "healthy breakfast nutrition morning food" },
    { tema: "Cuidado solar de fin de temporada", keywords: ["manchas", "reparación", "prevención"], pexels_query: "summer end sunset beach beautiful" },
    { tema: "Preparar el sistema inmune para otoño", keywords: ["defensas", "prevención", "vitaminas"], pexels_query: "nature outdoor wellness healthy autumn" },
    { tema: "Cosmética reparadora post-verano", keywords: ["sérum", "antioxidantes", "regeneración"], pexels_query: "beauty spa facial care natural woman" }
  ],
  9: [
    { tema: "Vuelta al cole saludable", keywords: ["sistema inmune niños", "mochilas", "piojos"], pexels_query: "children school happy backpack books" },
    { tema: "Recuperar la piel tras el verano", keywords: ["manchas sol", "hidratación", "peeling"], pexels_query: "skincare beauty facial treatment spa" },
    { tema: "Caída del cabello otoñal", keywords: ["biotina", "hierro", "champús anticaída"], pexels_query: "hair beauty autumn care natural" },
    { tema: "Retomar rutinas saludables", keywords: ["ejercicio", "alimentación", "sueño"], pexels_query: "morning routine healthy wellness active" },
    { tema: "Síndrome postvacacional", keywords: ["estrés", "adaptación", "ánimo"], pexels_query: "calm work balance wellness peaceful" },
    { tema: "Preparar las defensas para el otoño", keywords: ["vitamina C", "propóleo", "equinácea"], pexels_query: "autumn nature orange leaves healthy" },
    { tema: "Cuidado de la piel en transición estacional", keywords: ["hidratación", "cambio cremas", "adaptación"], pexels_query: "skincare autumn beauty woman natural" },
    { tema: "Nutrición para el nuevo curso", keywords: ["desayunos", "meriendas", "energía"], pexels_query: "healthy breakfast school nutrition food" },
    { tema: "Bienestar emocional en septiembre", keywords: ["motivación", "objetivos", "equilibrio"], pexels_query: "peaceful woman autumn nature balance" },
    { tema: "Ejercicio en otoño: nuevas rutinas", keywords: ["gimnasio", "running", "actividad"], pexels_query: "fitness autumn outdoor running nature" },
    { tema: "Cuidado de los ojos tras el verano", keywords: ["fatiga visual", "pantallas", "descanso"], pexels_query: "eyes rest peaceful woman calm" },
    { tema: "Suplementos para la energía otoñal", keywords: ["jalea real", "ginseng", "vitalidad"], pexels_query: "morning energy autumn vitality nature" },
    { tema: "Cosmética de transición verano-otoño", keywords: ["textura", "hidratación", "protección"], pexels_query: "beauty autumn skincare natural woman" },
    { tema: "Salud bucodental para el nuevo curso", keywords: ["higiene dental", "revisiones", "prevención"], pexels_query: "smile healthy teeth happy woman" },
    { tema: "Bienestar familiar en la vuelta al cole", keywords: ["organización", "salud familiar", "prevención"], pexels_query: "family happy outdoor nature autumn" }
  ],
  10: [
    { tema: "Preparar el sistema inmune para el otoño", keywords: ["propóleo", "equinácea", "vitamina C"], pexels_query: "autumn wellness nature orange leaves" },
    { tema: "Día mundial de la salud mental", keywords: ["ansiedad", "bienestar emocional"], pexels_query: "mental health calm meditation peaceful" },
    { tema: "Cuidado de la piel en otoño", keywords: ["hidratación", "vitamina E", "sérum"], pexels_query: "skincare autumn beauty natural woman" },
    { tema: "Halloween: maquillaje seguro", keywords: ["desmaquillantes", "piel sensible"], pexels_query: "beauty makeup care autumn woman" },
    { tema: "Cambio de hora: preparar el cuerpo", keywords: ["sueño", "melatonina", "luz natural"], pexels_query: "sleep cozy autumn rest peaceful" },
    { tema: "Prevención de resfriados otoñales", keywords: ["defensas", "vitaminas", "prevención"], pexels_query: "autumn nature cozy wellness tea warm" },
    { tema: "Cuidado del cabello en otoño", keywords: ["caída estacional", "fortalecimiento", "nutrición"], pexels_query: "hair beauty autumn care treatment" },
    { tema: "Bienestar digestivo otoñal", keywords: ["probióticos", "fibra", "equilibrio"], pexels_query: "healthy food autumn nutrition vegetables" },
    { tema: "Cosmética antiedad en otoño", keywords: ["renovación", "antioxidantes", "reparación"], pexels_query: "beauty spa facial autumn woman care" },
    { tema: "Nutrición para fortalecer defensas", keywords: ["superalimentos", "antioxidantes", "vitaminas"], pexels_query: "healthy food colorful vegetables autumn" },
    { tema: "Cuidado de labios y manos", keywords: ["hidratación", "reparación", "protección"], pexels_query: "hands care beauty woman autumn" },
    { tema: "Ejercicio indoor en otoño", keywords: ["gimnasio", "yoga", "pilates"], pexels_query: "yoga indoor exercise wellness woman" },
    { tema: "Aromaterapia para el otoño", keywords: ["aceites esenciales", "relajación", "bienestar"], pexels_query: "aromatherapy candles cozy autumn relaxation" },
    { tema: "Suplementos para el cambio estacional", keywords: ["adaptógenos", "energía", "equilibrio"], pexels_query: "autumn wellness nature balance peaceful" },
    { tema: "Cuidado de la piel sensible en otoño", keywords: ["rojeces", "calmante", "protección"], pexels_query: "sensitive skin care beauty natural" }
  ],
  11: [
    { tema: "Prevención de gripes y resfriados", keywords: ["vacuna gripe", "vitaminas", "defensas"], pexels_query: "winter wellness cozy tea warm comfort" },
    { tema: "Movember: salud masculina", keywords: ["próstata", "revisiones", "cáncer"], pexels_query: "man health wellness fitness active" },
    { tema: "Black Friday: ofertas en salud y belleza", keywords: ["cosmética", "productos estrella"], pexels_query: "beauty products skincare woman shopping" },
    { tema: "Cuidado de labios y manos en frío", keywords: ["bálsamo labial", "cremas manos"], pexels_query: "hands care winter beauty woman" },
    { tema: "Diabetes: mes de concienciación", keywords: ["glucosa", "prevención", "control"], pexels_query: "healthy food nutrition vegetables wellness" },
    { tema: "Sistema inmune en otoño-invierno", keywords: ["defensas", "propóleo", "vitamina C"], pexels_query: "winter nature wellness healthy outdoor" },
    { tema: "Cuidado de la piel en días fríos", keywords: ["hidratación intensa", "protección", "nutrición"], pexels_query: "skincare winter beauty woman natural" },
    { tema: "Bienestar respiratorio en invierno", keywords: ["vías respiratorias", "humidificación", "prevención"], pexels_query: "fresh air nature breathing outdoor" },
    { tema: "Nutrición invernal y sopas saludables", keywords: ["caldos", "vitaminas", "calor"], pexels_query: "soup warm healthy winter nutrition" },
    { tema: "Cosmética para eventos de fin de año", keywords: ["maquillaje festivo", "cuidado", "brillo"], pexels_query: "beauty makeup elegant woman festive" },
    { tema: "Suplementos para el ánimo invernal", keywords: ["vitamina D", "serotonina", "bienestar"], pexels_query: "winter light calm wellness mood" },
    { tema: "Cuidado del cabello en invierno", keywords: ["electricidad estática", "hidratación", "brillo"], pexels_query: "hair beauty winter care woman" },
    { tema: "Preparar el cuerpo para las fiestas", keywords: ["digestión", "excesos", "prevención"], pexels_query: "healthy food preparation wellness" },
    { tema: "Bienestar articular en frío", keywords: ["articulaciones", "colágeno", "movilidad"], pexels_query: "yoga stretching wellness flexibility" },
    { tema: "Cuidado de pies en invierno", keywords: ["calzado cerrado", "hidratación", "calor"], pexels_query: "cozy feet warm winter comfort" }
  ],
  12: [
    { tema: "Preparar el cuerpo para las fiestas", keywords: ["digestión", "probióticos", "excesos"], pexels_query: "healthy food wellness nutrition dinner" },
    { tema: "Regalos de Navidad saludables", keywords: ["cosmética", "bienestar", "sets regalo"], pexels_query: "gift beauty christmas wellness elegant" },
    { tema: "Cuidado de la piel en invierno", keywords: ["frío", "hidratación", "protección"], pexels_query: "winter skincare beauty woman care" },
    { tema: "Consejos para las cenas navideñas", keywords: ["digestivo", "acidez", "moderación"], pexels_query: "healthy dinner family festive nutrition" },
    { tema: "Propósitos saludables para el nuevo año", keywords: ["planificación", "hábitos", "salud"], pexels_query: "new year goals wellness healthy" },
    { tema: "Cosmética festiva y maquillaje de fiesta", keywords: ["brillo", "duración", "cuidado"], pexels_query: "beauty makeup festive elegant woman" },
    { tema: "Bienestar digestivo en Navidad", keywords: ["excesos", "digestión", "equilibrio"], pexels_query: "healthy food christmas nutrition" },
    { tema: "Cuidado del cabello para eventos", keywords: ["peinados", "brillo", "fijación"], pexels_query: "hair beauty elegant festive woman" },
    { tema: "Suplementos para las fiestas", keywords: ["energía", "digestión", "vitalidad"], pexels_query: "wellness vitality healthy festive" },
    { tema: "Ideas de regalos de bienestar", keywords: ["autocuidado", "spa", "relax"], pexels_query: "spa gift relaxation wellness beauty" },
    { tema: "Cuidado de la piel tras las fiestas", keywords: ["detox", "renovación", "hidratación"], pexels_query: "skincare refresh beauty woman natural" },
    { tema: "Bienestar emocional en Navidad", keywords: ["estrés festivo", "familia", "equilibrio"], pexels_query: "christmas peaceful calm family happy" },
    { tema: "Nutrición saludable en diciembre", keywords: ["equilibrio", "opciones light", "moderación"], pexels_query: "healthy food christmas vegetables fruit" },
    { tema: "Preparar el sistema inmune para el invierno", keywords: ["defensas", "vitaminas", "prevención"], pexels_query: "winter wellness healthy nature" },
    { tema: "Rituales de autocuidado de fin de año", keywords: ["mascarillas", "baño", "relajación"], pexels_query: "spa bath relaxation wellness woman" }
  ]
};

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

/**
 * Genera un hash numérico simple a partir de un string
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Asigna un tema a una farmacia de forma determinista pero distribuida
 * Usa el ID de la farmacia + mes para generar una distribución más uniforme
 */
export function getAssignedTopic(pharmacyIndex: number, month: number, pharmacyId?: string): SeasonalTopic {
  const monthTopics = SEASONAL_TOPICS[month] || SEASONAL_TOPICS[1];
  
  // Si tenemos ID de farmacia, usamos hash para mejor distribución
  if (pharmacyId) {
    const hash = hashCode(pharmacyId + month.toString());
    return monthTopics[hash % monthTopics.length];
  }
  
  // Fallback al comportamiento original con índice
  return monthTopics[pharmacyIndex % monthTopics.length];
}

/**
 * Obtiene todos los temas disponibles para un mes
 */
export function getTopicsForMonth(month: number): SeasonalTopic[] {
  return SEASONAL_TOPICS[month] || SEASONAL_TOPICS[1];
}