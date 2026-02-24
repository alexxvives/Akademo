import Link from 'next/link';
import { LegalNavbar } from '@/components/landing/LegalNavbar';

export const metadata = {
  title: 'Términos y Condiciones | AKADEMO',
  description: 'Términos y condiciones de uso de la plataforma AKADEMO.',
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <LegalNavbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Términos y Condiciones de Uso</h1>
        <p className="text-gray-500 text-sm mb-10">Última actualización: 23 de febrero de 2026</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Partes del Contrato</h2>
            <p>
              Estos Términos y Condiciones regulan la relación contractual entre <strong>AKADEMO</strong>
              (en adelante, "nosotros" o "el proveedor") y cualquier persona física o jurídica que acceda o
              utilice la plataforma AKADEMO (en adelante, "el Usuario"). Al crear una cuenta o utilizar la
              plataforma, el Usuario acepta íntegramente estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descripción del Servicio</h2>
            <p>
              AKADEMO es una plataforma tecnológica de gestión académica que permite a las academias y centros
              educativos (en adelante, "Academias") crear contenido formativo, gestionar alumnos, organizar
              clases en directo y presencial, gestionar pagos y proteger su propiedad intelectual.
            </p>
            <p className="mt-3">Los servicios incluyen, entre otros:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
              <li>Gestión de matrículas y alumnos</li>
              <li>Streaming de contenido audiovisual protegido</li>
              <li>Clases en directo integradas con Zoom</li>
              <li>Sistema de detección de cuentas compartidas</li>
              <li>Gestión de pagos y facturación</li>
              <li>Panel de administración para academias y profesores</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Registro y Cuenta de Usuario</h2>
            <p>
              Para acceder a la plataforma es necesario crear una cuenta. El Usuario se compromete a:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-2 text-sm">
              <li>Proporcionar información verídica, precisa y actualizada durante el registro.</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
              <li>Notificarnos inmediatamente ante cualquier uso no autorizado de su cuenta.</li>
              <li>No ceder, transferir ni compartir su cuenta con terceros.</li>
            </ul>
            <p className="mt-3">
              AKADEMO aplica sistemas automáticos de detección de acceso compartido. El uso de una cuenta por
              parte de varias personas simultáneas puede resultar en la suspensión del acceso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Condiciones Específicas para Academias</h2>
            <p>Las Academias que contrataron la plataforma aceptan adicionalmente:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2 text-sm">
              <li>Que son responsables del contenido que suben y publican en la plataforma.</li>
              <li>Que el contenido subido no infringe derechos de terceros (propiedad intelectual, derechos de imagen, etc.).</li>
              <li>Que gestionarán los datos personales de sus alumnos de acuerdo con la normativa de protección de datos vigente.</li>
              <li>Que no utilizarán la plataforma para difundir contenido ilegal, ofensivo o fraudulento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Precios y Facturación</h2>
            <p>
              Los precios de los planes de AKADEMO se acordarán individualmente con cada academia y se reflejarán
              en el contrato de servicio correspondiente. El precio incluirá los servicios descritos en dicho
              contrato. AKADEMO se reserva el derecho a modificar los precios con un preaviso mínimo de 30 días.
            </p>
            <p className="mt-3">
              Los pagos se procesarán a través de Stripe. Las facturas se emitirán electrónicamente y estarán
              disponibles en la sección de facturación de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Propiedad Intelectual</h2>
            <p>
              Todo el contenido, diseño, código fuente, marcas registradas y otros elementos de la plataforma
              AKADEMO son propiedad exclusiva de AKADEMO o de sus licenciantes y están protegidos por la
              normativa de propiedad intelectual e industrial.
            </p>
            <p className="mt-3">
              Las Academias conservan todos los derechos sobre el contenido que suben a la plataforma. Al subirlo,
              otorgan a AKADEMO una licencia limitada, no exclusiva y gratuita únicamente para prestar el
              servicio contratado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitación de Responsabilidad</h2>
            <p>
              AKADEMO no será responsable de:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-2 text-sm">
              <li>Interrupciones del servicio debidas a causas de fuerza mayor o mantenimiento programado.</li>
              <li>Daños indirectos, lucro cesante o pérdida de datos derivados del uso de la plataforma.</li>
              <li>Contenidos subidos por las Academias o sus usuarios.</li>
              <li>Problemas técnicos derivados de servicios de terceros (Zoom, Stripe, Cloudflare, etc.).</li>
            </ul>
            <p className="mt-3">
              En todo caso, la responsabilidad máxima de AKADEMO ante una Academia no podrá superar el importe
              pagado en los últimos 3 meses de servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Vigencia y Resolución del Contrato</h2>
            <p>
              Estos términos tienen vigencia indefinida desde la aceptación por parte del Usuario. AKADEMO podrá
              resolver el contrato con causa justificada (incumplimiento de términos, actividad fraudulenta, impago)
              con notificación previa por correo electrónico. El Usuario puede solicitar la baja de su cuenta en
              cualquier momento contactando a alex@akademo-edu.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Modificación de los Términos</h2>
            <p>
              AKADEMO podrá modificar estos términos en cualquier momento. Las modificaciones se notificarán
              con al menos 15 días de antelación. El uso continuado de la plataforma tras dicha notificación
              implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Legislación Aplicable y Jurisdicción</h2>
            <p>
              Estos términos se rigen por la legislación española. Para la resolución de conflictos, las partes
              se someten a la jurisdicción de los Juzgados y Tribunales de España, con renuncia expresa a
              cualquier otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos términos, contacta con nosotros en{' '}
              <a href="mailto:alex@akademo-edu.com" className="text-indigo-600 hover:underline">alex@akademo-edu.com</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">← Volver al inicio</Link>
        </div>
      </main>
    </div>
  );
}
