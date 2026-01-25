import { LegalLayout } from '@/components/marketing/LegalLayout';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <LegalLayout title="Política de Privacidad" lastUpdated="25 de enero de 2024">
      <h2>1. Introducción</h2>
      <p>
        En Blooglee nos comprometemos a proteger la privacidad de nuestros usuarios. Esta Política de Privacidad explica cómo recopilamos, utilizamos y protegemos tu información personal cuando utilizas nuestro servicio.
      </p>

      <h2>2. Datos que Recopilamos</h2>
      <p>
        Recopilamos la siguiente información cuando utilizas Blooglee:
      </p>
      <h3>2.1 Información proporcionada directamente</h3>
      <ul>
        <li><strong>Datos de cuenta:</strong> Email, nombre y contraseña al registrarte.</li>
        <li><strong>Datos de facturación:</strong> Información de pago procesada por nuestros proveedores.</li>
        <li><strong>Configuración de sitios:</strong> URLs de WordPress, credenciales de API y preferencias de contenido.</li>
      </ul>
      <h3>2.2 Información recopilada automáticamente</h3>
      <ul>
        <li><strong>Datos de uso:</strong> Páginas visitadas, funcionalidades utilizadas y patrones de uso.</li>
        <li><strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, sistema operativo.</li>
        <li><strong>Cookies:</strong> Ver nuestra <Link to="/cookies" className="text-violet-600 hover:underline">Política de Cookies</Link>.</li>
      </ul>

      <h2>3. Cómo Usamos tus Datos</h2>
      <p>
        Utilizamos la información recopilada para:
      </p>
      <ul>
        <li>Proporcionar y mejorar el servicio de Blooglee.</li>
        <li>Procesar pagos y gestionar tu suscripción.</li>
        <li>Comunicarnos contigo sobre tu cuenta y el servicio.</li>
        <li>Personalizar tu experiencia en la plataforma.</li>
        <li>Generar contenido adaptado a las características de tu negocio.</li>
        <li>Cumplir con obligaciones legales.</li>
      </ul>

      <h2>4. Servicios de Terceros</h2>
      <p>
        Blooglee utiliza servicios de terceros para operar:
      </p>
      <ul>
        <li><strong>WordPress:</strong> Para publicar contenido generado en tu sitio web.</li>
        <li><strong>Proveedores de IA:</strong> Para generar contenido (los datos se procesan de forma anónima).</li>
        <li><strong>Pexels/Unsplash:</strong> Para obtener imágenes libres de derechos.</li>
        <li><strong>Procesadores de pago:</strong> Para gestionar transacciones de forma segura.</li>
        <li><strong>Servicios de análisis:</strong> Para mejorar la experiencia del usuario.</li>
      </ul>

      <h2>5. Tus Derechos</h2>
      <p>
        Bajo el RGPD y la LOPD-GDD, tienes derecho a:
      </p>
      <ul>
        <li><strong>Acceso:</strong> Solicitar una copia de tus datos personales.</li>
        <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
        <li><strong>Supresión:</strong> Solicitar la eliminación de tus datos ("derecho al olvido").</li>
        <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado.</li>
        <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos.</li>
        <li><strong>Limitación:</strong> Restringir el tratamiento de tus datos.</li>
      </ul>
      <p>
        Para ejercer estos derechos, contacta con nosotros en <a href="mailto:info@blooglee.com" className="text-violet-600 hover:underline">info@blooglee.com</a>.
      </p>

      <h2>6. Seguridad</h2>
      <p>
        Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos:
      </p>
      <ul>
        <li>Cifrado de datos en tránsito (HTTPS/TLS).</li>
        <li>Almacenamiento seguro de contraseñas (hash + salt).</li>
        <li>Acceso restringido a datos personales.</li>
        <li>Monitorización continua de seguridad.</li>
        <li>Copias de seguridad regulares.</li>
      </ul>

      <h2>7. Retención de Datos</h2>
      <p>
        Conservamos tus datos personales mientras mantengas una cuenta activa con Blooglee. Tras la cancelación de tu cuenta:
      </p>
      <ul>
        <li>Los datos de cuenta se eliminan en un plazo de 30 días.</li>
        <li>Los datos de facturación se conservan según obligaciones fiscales (hasta 6 años).</li>
        <li>Las copias de seguridad se purgan en un plazo de 90 días.</li>
      </ul>

      <h2>8. Transferencias Internacionales</h2>
      <p>
        Algunos de nuestros proveedores pueden estar ubicados fuera del Espacio Económico Europeo. En estos casos, garantizamos que existan salvaguardas adecuadas (cláusulas contractuales tipo, decisiones de adecuación).
      </p>

      <h2>9. Cambios en la Política</h2>
      <p>
        Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos cualquier cambio significativo por email o mediante un aviso en la plataforma. La fecha de última actualización aparece al principio de este documento.
      </p>

      <h2>10. Contacto</h2>
      <p>
        Si tienes preguntas sobre esta Política de Privacidad o sobre cómo tratamos tus datos, puedes contactarnos en:
      </p>
      <p>
        <strong>Email:</strong> <a href="mailto:info@blooglee.com" className="text-violet-600 hover:underline">info@blooglee.com</a>
      </p>

      <div className="mt-8 p-4 bg-violet-50 rounded-xl">
        <p className="text-sm text-foreground/60">
          <strong>Nota:</strong> Este documento es un modelo y debe ser revisado por un profesional legal antes de su uso definitivo.
        </p>
      </div>
    </LegalLayout>
  );
};

export default PrivacyPage;
