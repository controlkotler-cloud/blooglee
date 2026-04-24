import {
  Megaphone,
  User,
  Stethoscope,
  ShoppingCart,
  Briefcase,
  BarChart3,
  Layers,
  Clock,
  Wallet,
  Target,
  Heart,
  Search,
  Package,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import type { UseCasePageProps } from "@/components/marketing/UseCasePage";

export const agenciasUseCase: UseCasePageProps = {
  sector: "agencias",
  seo: {
    title: "Blog Automático para Agencias de Marketing",
    description:
      "Automatiza el blog de tus clientes con Blooglee. Gestiona múltiples webs WordPress desde un dashboard. Ideal para agencias de marketing digital.",
    canonicalUrl: "/para/agencias-marketing",
    keywords:
      "contenido agencias marketing, automatizar blogs clientes, white-label blog, producción contenido agencias",
  },
  hero: {
    badge: "Para Agencias",
    icon: Megaphone,
    titleGradient: "Escala tu producción de contenido",
    titleRest: "sin ampliar el equipo",
    subtitle: (
      <>
        Gestiona el content marketing de todos tus clientes desde un solo dashboard.{" "}
        <strong className="text-foreground">White-label incluido, entregas siempre a tiempo.</strong>
      </>
    ),
    gradient: "from-violet-500 via-fuchsia-500 to-orange-400",
    primaryCta: { label: "Probar gratis", to: "/waitlist" },
    secondaryCta: { label: "Ver plan Agencia", to: "/pricing" },
  },
  stats: [
    { value: "-70%", label: "Costes producción", description: "Vs redactores" },
    { value: "40h", label: "Ahorro mensual", description: "Por agencia" },
    { value: "10", label: "Sitios incluidos", description: "Plan Agencia" },
  ],
  featuresGrid: {
    title: "Por qué las agencias eligen Blooglee",
    features: [
      {
        icon: Layers,
        title: "Gestión multi-cliente",
        description:
          "Dashboard centralizado para gestionar hasta 10 sitios con configuraciones independientes.",
      },
      {
        icon: Briefcase,
        title: "White-label incluido",
        description: "Presenta el contenido como producción propia. Sin menciones a Blooglee.",
      },
      {
        icon: BarChart3,
        title: "Escalabilidad garantizada",
        description: "Acepta más proyectos sin ampliar equipo ni aumentar costes operativos.",
      },
      {
        icon: Clock,
        title: "Entregas puntuales",
        description: "Nunca más retrasos en entregas. Genera contenido en segundos, cuando lo necesites.",
      },
    ],
  },
  problemSolution: {
    problemTitle: "El cuello de botella del content marketing",
    problems: [
      "Los redactores freelance tienen límites de capacidad",
      "Contratar un equipo interno es costoso y lento",
      "Los clientes esperan entregas puntuales y consistentes",
    ],
    solutionTitle: "Blooglee escala contigo",
    solutions: [
      "Artículos ilimitados por 149€/mes",
      "10 sitios de clientes desde un dashboard",
      "Entregas en segundos, nunca más retrasos",
    ],
  },
  testimonialsBlock: {
    title: "Lo que dicen las agencias",
    testimonials: [
      {
        name: "Laura Sánchez",
        role: "Account Director",
        company: "Agencia Momentum",
        rating: 5,
        review:
          "Gestionamos 8 clientes con Blooglee. Hemos reducido los costes de producción de contenido un 70% y podemos aceptar más proyectos sin ampliar el equipo.",
        datePublished: "2026-01-15",
      },
      {
        name: "Pablo Fernández",
        role: "CEO",
        company: "Digital Growth Agency",
        rating: 5,
        review:
          "Blooglee nos permite escalar el servicio de content marketing sin sacrificar calidad. El white-label es perfecto para mantener nuestra marca.",
        datePublished: "2026-01-10",
      },
    ],
  },
  leadMagnets: {
    title: "Recursos gratuitos para agencias",
    subtitle: "Descarga plantillas para escalar tu producción de contenido",
  },
  faqsBlock: {
    faqs: [
      {
        question: "¿Puedo gestionar múltiples clientes con Blooglee?",
        answer:
          "Sí, el plan Agencia permite gestionar hasta 10 sitios web desde un único dashboard. Cada sitio tiene su configuración independiente de sector, frecuencia y estilo de contenido.",
      },
      {
        question: "¿Blooglee ofrece white-label para agencias?",
        answer:
          "Sí, el plan Agencia incluye opción white-label. El contenido no menciona a Blooglee y puedes presentarlo como producción propia a tus clientes.",
      },
      {
        question: "¿Cómo factura Blooglee a agencias?",
        answer:
          "Emitimos facturas con IVA para empresas españolas. Para empresas de la UE con NIF intracomunitario válido, el IVA es 0%. Pago mensual o anual con 20% de descuento.",
      },
      {
        question: "¿Puedo generar contenido para diferentes sectores?",
        answer:
          "Sí, cada sitio puede tener su propio sector configurado: salud, tecnología, retail, servicios, etc. La IA adapta el tono y vocabulario a cada industria.",
      },
      {
        question: "¿Qué ROI puedo esperar usando Blooglee?",
        answer:
          "Nuestras agencias clientes ahorran un promedio de 40 horas/mes en producción de contenido, reduciendo costes operativos un 70% comparado con redactores freelance.",
      },
      {
        question: "¿Hay API para integraciones personalizadas?",
        answer:
          "Sí, el plan Agencia incluye acceso a la API para automatizaciones avanzadas y integraciones con tus herramientas de gestión de proyectos.",
      },
    ],
  },
  finalCta: {
    title: "Escala tu agencia sin límites",
    subtitle: "Plan Agencia: 10 sitios, artículos ilimitados, white-label incluido.",
    buttonLabel: "Empezar ahora",
    buttonTo: "/waitlist",
  },
  sectionsOrder: ["featuresGrid", "problemSolution", "testimonials", "leadMagnets", "faqs"],
};

export const autonomosUseCase: UseCasePageProps = {
  sector: "autonomos",
  seo: {
    title: "Blog Profesional para Autónomos",
    description:
      "Blog profesional sin esfuerzo para autónomos. Genera artículos con IA optimizados para SEO y publica en WordPress automáticamente.",
    canonicalUrl: "/para/autonomos",
    keywords: "blog autónomo, marketing autónomos, SEO freelance, visibilidad negocio local",
  },
  hero: {
    badge: "Para Autónomos",
    icon: User,
    titleGradient: "Un blog profesional",
    titleRest: "sin dedicar horas",
    subtitle: (
      <>
        Como autónomo, tu tiempo vale oro.
        <strong className="text-foreground">
          {" "}
          Blooglee genera contenido profesional por menos de lo que cuesta un café al día.
        </strong>
      </>
    ),
    gradient: "from-violet-500 via-fuchsia-500 to-orange-400",
    primaryCta: { label: "Empezar gratis", to: "/waitlist" },
    secondaryCta: { label: "Ver precios", to: "/pricing" },
  },
  stats: [
    { value: "19€", label: "Por mes", description: "Plan Starter" },
    { value: "5min", label: "A la semana", description: "Tiempo invertido" },
    { value: "+60%", label: "Visibilidad local", description: "En 3 meses" },
  ],
  featuresGrid: {
    title: "Diseñado para profesionales como tú",
    features: [
      {
        icon: Wallet,
        title: "Precio de autónomo",
        description:
          "Desde 0€/mes. El plan Starter (19€) cuesta menos que 4 cafés y genera 4 artículos profesionales.",
      },
      {
        icon: Clock,
        title: "Sin perder tiempo",
        description:
          "5 minutos a la semana: generas, revisas y publicas. Dedica tu tiempo a lo que importa: tus clientes.",
      },
      {
        icon: Target,
        title: "Visibilidad local",
        description:
          'Aparece en búsquedas locales de tu ciudad. "Arquitecto Barcelona", "Fisio Madrid" - posiciona tu negocio.',
      },
      {
        icon: Briefcase,
        title: "Imagen profesional",
        description:
          "Un blog activo transmite expertise y genera confianza. Compite con empresas grandes desde tu casa.",
      },
    ],
  },
  sectorChips: {
    title: "Autónomos de todos los sectores",
    sectors: [
      "Abogados",
      "Arquitectos",
      "Psicólogos",
      "Nutricionistas",
      "Consultores",
      "Fisioterapeutas",
      "Contables",
      "Diseñadores",
      "Coaches",
      "Fotógrafos",
    ],
    footer: "Y muchos más. Blooglee se adapta a cualquier profesión.",
  },
  problemSolution: {
    problemTitle: "El problema del autónomo",
    problems: [
      "No tienes tiempo para escribir artículos",
      "Contratar un redactor no cabe en tu presupuesto",
      "Tu web está estancada y no apareces en Google",
    ],
    solutionTitle: "Blooglee: tu solución",
    solutions: [
      "5 minutos a la semana, no horas",
      "Desde 19€/mes - menos que 4 cafés",
      "Posiciona tu negocio en búsquedas locales",
    ],
  },
  testimonialsBlock: {
    title: "Autónomos que ya confían en Blooglee",
    testimonials: [
      {
        name: "José Manuel Torres",
        role: "Abogado",
        company: "Despacho Torres",
        rating: 5,
        review:
          "Como abogado autónomo, no tenía tiempo ni presupuesto para un blog. Blooglee me permite publicar artículos legales cada semana por menos de lo que cuesta un café al día.",
        datePublished: "2026-01-15",
      },
      {
        name: "Lucía Hernández",
        role: "Psicóloga",
        company: "Consulta Lucía Hernández",
        rating: 5,
        review:
          'El blog ha sido clave para darme a conocer. Pacientes me encuentran buscando temas como "ansiedad laboral" y llegan a mi consulta desde el blog.',
        datePublished: "2026-01-10",
      },
    ],
  },
  leadMagnets: {
    title: "Recursos gratuitos para autónomos",
    subtitle: "Descarga guías para posicionar tu negocio local",
  },
  faqsBlock: {
    faqs: [
      {
        question: "¿Blooglee es asequible para un autónomo?",
        answer:
          "Sí, el plan Free es gratuito y el Starter cuesta solo 19€/mes (4 artículos). Es 10 veces más barato que contratar un redactor freelance para la misma cantidad de contenido.",
      },
      {
        question: "¿Necesito conocimientos técnicos para usar Blooglee?",
        answer:
          "No. Blooglee está diseñado para ser muy fácil de usar. Si sabes publicar en WordPress, sabes usar Blooglee. El proceso es: conectas tu web, generas artículo, y publicas con un clic.",
      },
      {
        question: "¿Puedo gestionar el blog de mi negocio sin dedicar horas?",
        answer:
          "Sí, ese es exactamente el objetivo. Blooglee genera un artículo completo en 60 segundos. Puedes revisar y publicar en menos de 5 minutos a la semana.",
      },
      {
        question: "¿El contenido es relevante para mi sector?",
        answer:
          "Sí. Configuras el sector de tu negocio (abogado, arquitecto, consultor, terapeuta, etc.) y Blooglee adapta el vocabulario, tono y temas a tu industria.",
      },
      {
        question: "¿Cómo ayuda el blog a conseguir clientes?",
        answer:
          'Un blog activo mejora tu posicionamiento en Google para búsquedas locales. Cuando alguien busca "abogado divorcios Madrid", un blog con artículos relevantes te hace visible.',
      },
    ],
  },
  finalCta: {
    title: "Tu negocio merece un blog profesional",
    subtitle: "Únete a la lista de espera y accede antes que nadie.",
    buttonLabel: "Crear mi blog ahora",
    buttonTo: "/waitlist",
  },
  sectionsOrder: ["featuresGrid", "sectorChips", "problemSolution", "testimonials", "leadMagnets", "faqs"],
};

export const clinicasUseCase: UseCasePageProps = {
  sector: "clinicas",
  seo: {
    title: "Blog Automático para Clínicas",
    description:
      "Blog automático para clínicas y centros de salud. Genera artículos médicos con IA optimizados para SEO. Atrae pacientes con contenido profesional.",
    canonicalUrl: "/para/clinicas",
    keywords: "blog clínica, contenido clínica estética, marketing clínicas, SEO clínicas médicas, atraer pacientes",
  },
  hero: {
    badge: "Para Clínicas",
    icon: Stethoscope,
    titleGradient: "Tu clínica necesita un blog",
    titleRest: "que atraiga pacientes",
    subtitle: (
      <>
        El 77% de los pacientes investigan online antes de elegir una clínica.
        <strong className="text-foreground">
          {" "}
          Blooglee genera contenido que posiciona tu clínica en Google.
        </strong>
      </>
    ),
    gradient: "from-violet-500 via-fuchsia-500 to-orange-400",
    primaryCta: { label: "Probar gratis", to: "/waitlist" },
    secondaryCta: { label: "Ver precios", to: "/pricing" },
  },
  stats: [
    { value: "+340%", label: "Tráfico orgánico", description: "En 6 meses" },
    { value: "+45", label: "Artículos publicados", description: "Sin esfuerzo" },
    { value: "15h", label: "Ahorro mensual", description: "En redacción" },
  ],
  successCases: {
    title: "Casos de éxito en el sector salud",
    icon: Heart,
    cases: [
      {
        title: "Clínicas de Medicina Estética",
        description:
          "Genera contenido sobre tratamientos faciales, corporales, cuidados post-tratamiento y novedades en estética.",
        results: "Clínica Luna: +340% tráfico orgánico",
      },
      {
        title: "Clínicas Dentales",
        description:
          "Artículos sobre higiene bucal, implantes, ortodoncia y prevención de caries para atraer pacientes.",
        results: "Centro Dental Plus: +15 pacientes/mes desde el blog",
      },
      {
        title: "Centros de Fisioterapia",
        description: "Contenido sobre lesiones deportivas, rehabilitación, ejercicios preventivos y bienestar.",
        results: "Fisio Barcelona: +200% visibilidad local",
      },
    ],
  },
  problemSolution: {
    problemTitle: "El problema de las clínicas",
    problems: [
      "No hay tiempo para escribir artículos entre consultas",
      "Contratar un redactor de salud es caro (500€+/mes)",
      "La competencia posiciona mejor en Google",
    ],
    solutionTitle: "La solución: Blooglee",
    solutions: [
      "Genera artículos en 60 segundos, sin escribir",
      "Desde 19€/mes, 10x más barato que un redactor",
      "SEO optimizado para atraer pacientes locales",
    ],
  },
  testimonialsBlock: {
    title: "Lo que dicen las clínicas",
    testimonials: [
      {
        name: "Dra. María García",
        role: "Directora Médica",
        company: "Clínica Estética Luna",
        rating: 5,
        review:
          "Blooglee ha transformado nuestra presencia digital. Pasamos de 0 a 45 artículos en 6 meses y nuestro tráfico orgánico creció un 340%. Ahora recibimos consultas directas desde el blog.",
        datePublished: "2026-01-15",
      },
      {
        name: "Dr. Carlos Ruiz",
        role: "Director",
        company: "Centro Dermatológico Ruiz",
        rating: 5,
        review:
          "Como dermatólogo, no tenía tiempo para escribir artículos. Blooglee genera contenido de calidad sobre cuidados de la piel que mis pacientes valoran mucho.",
        datePublished: "2026-01-10",
      },
    ],
  },
  leadMagnets: {
    title: "Recursos gratuitos para clínicas",
    subtitle: "Descarga plantillas y guías específicas para el sector salud",
  },
  faqsBlock: {
    faqs: [
      {
        question: "¿Blooglee es adecuado para clínicas de medicina estética?",
        answer:
          "Sí, Blooglee está especialmente optimizado para clínicas de medicina estética, dermatología, odontología y salud en general. Genera contenido sobre tratamientos, cuidados y novedades del sector salud.",
      },
      {
        question: "¿El contenido médico generado es fiable?",
        answer:
          "Blooglee genera contenido informativo general sobre salud y bienestar. Para información médica específica, siempre recomendamos que un profesional de la salud revise el contenido antes de publicar.",
      },
      {
        question: "¿Puedo generar artículos sobre tratamientos específicos?",
        answer:
          "Sí, puedes configurar temas personalizados sobre los tratamientos que ofrece tu clínica: botox, ácido hialurónico, depilación láser, implantes dentales, etc.",
      },
      {
        question: "¿Blooglee ayuda a atraer pacientes locales?",
        answer:
          "Sí, el contenido generado está optimizado para SEO local. Puedes configurar tu ubicación para que los artículos mencionen tu ciudad y atraigan pacientes de tu zona.",
      },
      {
        question: "¿Cuántos artículos necesita una clínica al mes?",
        answer:
          "Recomendamos entre 4-8 artículos mensuales para clínicas. El plan Starter (4 artículos) es perfecto para empezar, y el Pro (30 artículos) para clínicas con múltiples especialidades.",
      },
    ],
  },
  finalCta: {
    title: "Empieza a atraer pacientes hoy",
    subtitle: "Únete a la lista de espera y consigue acceso anticipado para tu clínica.",
    buttonLabel: "Unirme a la lista de espera",
    buttonTo: "/waitlist",
  },
  sectionsOrder: ["problemSolution", "successCases", "testimonials", "leadMagnets", "faqs"],
};

export const ecommerceUseCase: UseCasePageProps = {
  sector: "ecommerce",
  seo: {
    title: "Blog Automático para Tiendas Online",
    description:
      "Blog automático para ecommerce. Genera artículos de producto con IA y atrae tráfico orgánico a tu tienda online WordPress.",
    canonicalUrl: "/para/tiendas-online",
    keywords: "blog ecommerce, contenido tienda online, SEO WooCommerce, marketing contenidos ecommerce",
  },
  hero: {
    badge: "Para E-commerce",
    icon: ShoppingCart,
    titleGradient: "Tu tienda online necesita un blog",
    titleRest: "que venda",
    subtitle: (
      <>
        El 68% de las compras online empiezan con una búsqueda en Google.
        <strong className="text-foreground">
          {" "}
          Blooglee genera contenido que atrae compradores a tu tienda.
        </strong>
      </>
    ),
    gradient: "from-violet-500 via-fuchsia-500 to-orange-400",
    primaryCta: { label: "Probar gratis", to: "/waitlist" },
    secondaryCta: { label: "Ver precios", to: "/pricing" },
  },
  stats: [
    { value: "+280%", label: "Tráfico orgánico", description: "En 6 meses" },
    { value: "15%", label: "Ventas desde blog", description: "Conversión media" },
    { value: "+50", label: "Artículos SEO", description: "Posicionados" },
  ],
  featuresGrid: {
    title: "Contenido que convierte visitantes en compradores",
    features: [
      {
        icon: Search,
        title: "Guías de compra",
        description:
          '"Mejores portátiles para estudiantes 2026" - Contenido que captura búsquedas de intención comercial.',
      },
      {
        icon: Package,
        title: "Comparativas de productos",
        description: '"iPhone 16 vs Samsung S26" - Artículos que ayudan a decidir y convierten.',
      },
      {
        icon: TrendingUp,
        title: "Tendencias y novedades",
        description: "Contenido sobre nuevos productos y tendencias del sector para posicionar como experto.",
      },
      {
        icon: DollarSign,
        title: "Contenido de temporada",
        description: "Black Friday, Navidad, rebajas - Genera tráfico extra en fechas comerciales clave.",
      },
    ],
  },
  problemSolution: {
    problemTitle: "El problema del e-commerce",
    problems: [
      "Dependes de Google Ads para conseguir tráfico",
      "Los competidores posicionan mejor en orgánico",
      "El coste por clic sube cada año",
    ],
    solutionTitle: "Blooglee reduce tu dependencia de ads",
    solutions: [
      "Tráfico orgánico gratuito y sostenible",
      "Guías de compra que convierten visitantes en clientes",
      "Compatible con WooCommerce, Shopify, Prestashop",
    ],
  },
  testimonialsBlock: {
    title: "Tiendas online que ya usan Blooglee",
    testimonials: [
      {
        name: "Elena Martín",
        role: "CEO",
        company: "TechGadgets.es",
        rating: 5,
        review:
          "Nuestro blog pasó de 0 a 50 artículos en 6 meses. El tráfico orgánico creció un 280% y las ventas desde el blog representan ya el 15% del total.",
        datePublished: "2026-01-15",
      },
      {
        name: "David López",
        role: "Fundador",
        company: "Deportes Plus Online",
        rating: 5,
        review:
          'Las guías de compra que genera Blooglee posicionan muy bien. Ahora aparecemos en búsquedas como "mejores zapatillas running" y convertimos ese tráfico en ventas.',
        datePublished: "2026-01-10",
      },
    ],
  },
  leadMagnets: {
    title: "Recursos gratuitos para e-commerce",
    subtitle: "Descarga calendarios y guías para vender más con tu blog",
  },
  faqsBlock: {
    faqs: [
      {
        question: "¿Blooglee funciona con WooCommerce?",
        answer:
          "Sí, Blooglee es 100% compatible con WooCommerce. Publica artículos en el blog de tu tienda online para atraer tráfico orgánico y convertir visitantes en clientes.",
      },
      {
        question: "¿Qué tipo de contenido genera para e-commerce?",
        answer:
          "Blooglee genera guías de compra, comparativas de productos, tendencias del sector, tutoriales de uso y contenido de temporada (Black Friday, Navidad, rebajas).",
      },
      {
        question: "¿El contenido menciona mis productos?",
        answer:
          "Puedes configurar temas personalizados que incluyan categorías de productos de tu tienda. Blooglee adaptará el contenido para ser relevante para tu catálogo.",
      },
      {
        question: "¿Cómo ayuda el blog a vender más?",
        answer:
          'Un blog con contenido SEO optimizado atrae tráfico orgánico cualificado. Usuarios que buscan "mejores auriculares bluetooth" llegan a tu guía y descubren tus productos.',
      },
      {
        question: "¿Puedo generar contenido de temporada automáticamente?",
        answer:
          "Sí, Blooglee detecta eventos comerciales (Black Friday, Navidad, San Valentín) y sugiere temas relevantes para maximizar el tráfico en fechas clave.",
      },
    ],
  },
  finalCta: {
    title: "Vende más con contenido SEO",
    subtitle: "Prueba Blooglee gratis y genera tu primera guía de compra.",
    buttonLabel: "Empezar gratis",
    buttonTo: "/waitlist",
  },
  sectionsOrder: ["featuresGrid", "problemSolution", "testimonials", "leadMagnets", "faqs"],
};
