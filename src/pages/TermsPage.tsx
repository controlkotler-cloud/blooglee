import { LegalLayout } from '@/components/marketing/LegalLayout';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <LegalLayout title="Términos y Condiciones" lastUpdated="25 de enero de 2024">
      <h2>1. Definiciones</h2>
      <p>
        En los presentes Términos y Condiciones, los siguientes términos tendrán los significados que se indican a continuación:
      </p>
      <ul>
        <li><strong>"Blooglee"</strong>: La plataforma de generación automática de contenido para blogs, propiedad y operada por Blooglee.</li>
        <li><strong>"Servicio"</strong>: Todos los servicios ofrecidos por Blooglee, incluyendo la generación de artículos con IA, publicación en WordPress y funcionalidades relacionadas.</li>
        <li><strong>"Usuario"</strong>: Cualquier persona física o jurídica que acceda o utilice el Servicio.</li>
        <li><strong>"Contenido"</strong>: Artículos, textos, imágenes y cualquier otro material generado a través del Servicio.</li>
      </ul>

      <h2>2. Uso del Servicio</h2>
      <p>
        Al utilizar Blooglee, el Usuario acepta cumplir con estos Términos y Condiciones. El uso del Servicio está sujeto a las siguientes condiciones:
      </p>
      <ul>
        <li>El Usuario debe ser mayor de edad o contar con autorización legal para contratar.</li>
        <li>El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
        <li>El uso del Servicio debe cumplir con todas las leyes aplicables.</li>
        <li>El Usuario no utilizará el Servicio para generar contenido ilegal, ofensivo o que viole derechos de terceros.</li>
      </ul>

      <h2>3. Registro y Cuenta</h2>
      <p>
        Para acceder a determinadas funcionalidades del Servicio, el Usuario deberá crear una cuenta proporcionando información veraz y actualizada. El Usuario se compromete a:
      </p>
      <ul>
        <li>Proporcionar información precisa durante el registro.</li>
        <li>Mantener sus datos de cuenta actualizados.</li>
        <li>No compartir sus credenciales de acceso con terceros.</li>
        <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta.</li>
      </ul>

      <h2>4. Planes y Facturación</h2>
      <p>
        Blooglee ofrece diferentes planes de suscripción. Los detalles de cada plan, incluyendo precios y funcionalidades, están disponibles en nuestra página de <Link to="/pricing" className="text-violet-600 hover:underline">Precios</Link>.
      </p>
      <ul>
        <li>Los pagos se procesan de forma segura a través de proveedores de pago autorizados.</li>
        <li>Las suscripciones se renuevan automáticamente salvo cancelación previa.</li>
        <li>Los reembolsos se gestionarán según nuestra política de reembolsos vigente.</li>
        <li>Blooglee se reserva el derecho de modificar los precios con previo aviso.</li>
      </ul>

      <h2>5. Propiedad Intelectual</h2>
      <p>
        El contenido generado a través de Blooglee es propiedad del Usuario que lo genera. Sin embargo:
      </p>
      <ul>
        <li>Blooglee retiene todos los derechos sobre la plataforma, tecnología y marca.</li>
        <li>Las imágenes utilizadas en el contenido están sujetas a licencias de terceros (Pexels, Unsplash).</li>
        <li>El Usuario es responsable de incluir los créditos correspondientes cuando sea requerido.</li>
        <li>El Usuario no adquiere derechos sobre la tecnología de IA utilizada para generar contenido.</li>
      </ul>

      <h2>6. Limitación de Responsabilidad</h2>
      <p>
        Blooglee proporciona el Servicio "tal cual" y no garantiza:
      </p>
      <ul>
        <li>Que el Servicio esté libre de errores o interrupciones.</li>
        <li>Resultados específicos de SEO o posicionamiento.</li>
        <li>La precisión absoluta del contenido generado por IA.</li>
        <li>Compatibilidad con todas las versiones de WordPress o plugins.</li>
      </ul>
      <p>
        En ningún caso Blooglee será responsable por daños indirectos, incidentales o consecuentes derivados del uso del Servicio.
      </p>

      <h2>7. Modificaciones</h2>
      <p>
        Blooglee se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones serán efectivas desde su publicación en el sitio web. El uso continuado del Servicio tras las modificaciones constituye la aceptación de los nuevos términos.
      </p>

      <h2>8. Ley Aplicable</h2>
      <p>
        Estos Términos y Condiciones se rigen por las leyes de España. Cualquier disputa relacionada con el uso del Servicio será sometida a la jurisdicción exclusiva de los tribunales de Barcelona.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para cualquier consulta relacionada con estos Términos y Condiciones, puedes contactarnos en:
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

export default TermsPage;
