import { LegalLayout } from '@/components/marketing/LegalLayout';
import { Link } from 'react-router-dom';

const CookiesPage = () => {
  return (
    <LegalLayout title="Política de Cookies" lastUpdated="25 de enero de 2024">
      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.
      </p>

      <h2>2. ¿Cómo utilizamos las cookies?</h2>
      <p>
        En Blooglee utilizamos cookies para diversos propósitos, incluyendo:
      </p>
      <ul>
        <li>Mantener tu sesión iniciada mientras navegas.</li>
        <li>Recordar tus preferencias y configuración.</li>
        <li>Entender cómo utilizas nuestra plataforma.</li>
        <li>Mejorar la seguridad de tu cuenta.</li>
      </ul>

      <h2>3. Tipos de Cookies que Utilizamos</h2>
      
      <h3>3.1 Cookies Esenciales</h3>
      <p>
        Estas cookies son necesarias para el funcionamiento básico del sitio. Sin ellas, no podrías iniciar sesión ni utilizar las funcionalidades principales.
      </p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border border-violet-100 rounded-xl overflow-hidden">
          <thead className="bg-violet-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Cookie</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Propósito</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Duración</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-violet-100">
            <tr>
              <td className="px-4 py-3 text-sm font-mono">sb-auth-token</td>
              <td className="px-4 py-3 text-sm">Autenticación de usuario</td>
              <td className="px-4 py-3 text-sm">7 días</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-mono">sb-refresh-token</td>
              <td className="px-4 py-3 text-sm">Renovación de sesión</td>
              <td className="px-4 py-3 text-sm">30 días</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>3.2 Cookies Funcionales</h3>
      <p>
        Estas cookies permiten recordar las elecciones que realizas y proporcionar funciones mejoradas y personalizadas.
      </p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border border-violet-100 rounded-xl overflow-hidden">
          <thead className="bg-violet-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Cookie</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Propósito</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Duración</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-violet-100">
            <tr>
              <td className="px-4 py-3 text-sm font-mono">theme</td>
              <td className="px-4 py-3 text-sm">Preferencia de tema (claro/oscuro)</td>
              <td className="px-4 py-3 text-sm">1 año</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-mono">lang</td>
              <td className="px-4 py-3 text-sm">Preferencia de idioma</td>
              <td className="px-4 py-3 text-sm">1 año</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>3.3 Cookies Analíticas</h3>
      <p>
        Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web, recopilando información de forma anónima.
      </p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border border-violet-100 rounded-xl overflow-hidden">
          <thead className="bg-violet-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Cookie</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Propósito</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Duración</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-violet-100">
            <tr>
              <td className="px-4 py-3 text-sm font-mono">_ga</td>
              <td className="px-4 py-3 text-sm">Google Analytics - Identificación de usuarios</td>
              <td className="px-4 py-3 text-sm">2 años</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-mono">_gid</td>
              <td className="px-4 py-3 text-sm">Google Analytics - Identificación de sesiones</td>
              <td className="px-4 py-3 text-sm">24 horas</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>4. Cómo Gestionar las Cookies</h2>
      <p>
        Puedes controlar y/o eliminar las cookies según desees. Puedes eliminar todas las cookies que ya están en tu dispositivo y configurar la mayoría de los navegadores para evitar que se almacenen.
      </p>
      
      <h3>Configuración por navegador:</h3>
      <ul>
        <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
        <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
        <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
        <li><strong>Edge:</strong> Configuración → Privacidad → Cookies</li>
      </ul>
      
      <p>
        Ten en cuenta que si deshabilitas las cookies esenciales, algunas partes de nuestro sitio pueden no funcionar correctamente.
      </p>

      <h2>5. Cookies de Terceros</h2>
      <p>
        Algunas cookies son colocadas por servicios de terceros que aparecen en nuestras páginas:
      </p>
      <ul>
        <li><strong>Google Analytics:</strong> Para análisis de uso del sitio.</li>
        <li><strong>Stripe:</strong> Para procesar pagos de forma segura.</li>
      </ul>

      <h2>6. Actualizaciones de esta Política</h2>
      <p>
        Podemos actualizar esta Política de Cookies ocasionalmente. Te recomendamos revisar esta página periódicamente para estar informado sobre cómo utilizamos las cookies.
      </p>

      <h2>7. Más Información</h2>
      <p>
        Para más información sobre cómo tratamos tus datos personales, consulta nuestra <Link to="/privacy" className="text-violet-600 hover:underline">Política de Privacidad</Link>.
      </p>
      <p>
        Si tienes preguntas sobre esta Política de Cookies, puedes contactarnos en:
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

export default CookiesPage;
