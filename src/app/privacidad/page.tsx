import { LegalNavbar } from '@/components/landing/LegalNavbar';
import { Footer } from '@/components/landing/Footer';

export const metadata = {
  title: 'Política de Privacidad | AKADEMO',
  description: 'Política de privacidad y protección de datos de AKADEMO.',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      <LegalNavbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-gray-500 text-sm mb-10">Última actualización: 23 de febrero de 2026</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Responsable del Tratamiento</h2>
            <p>
              En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo (RGPD) y la Ley Orgánica 3/2018
              de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), te informamos que
              el responsable del tratamiento de tus datos personales es:
            </p>
            <ul className="list-none mt-3 space-y-1 text-sm">
              <li><strong>Denominación:</strong> AKADEMO</li>
              <li><strong>Correo electrónico:</strong> alex@akademo-edu.com</li>
              <li><strong>Sitio web:</strong> https://akademo-edu.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Datos que Recopilamos</h2>
            <p>Recopilamos los siguientes tipos de datos personales:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2 text-sm">
              <li><strong>Datos de registro:</strong> nombre, apellidos, dirección de correo electrónico y contraseña.</li>
              <li><strong>Datos de uso:</strong> información sobre cómo interactúas con la plataforma (páginas visitadas, clases accedidas, tiempos de visualización).</li>
              <li><strong>Datos de pago:</strong> gestionados por pasarelas de pago externas (Stripe). No almacenamos datos de tarjeta bancaria.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo, sistema operativo, navegador y registros de acceso.</li>
              <li><strong>Datos de comunicación:</strong> mensajes enviados a través del formulario de contacto.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Finalidades y Base Jurídica del Tratamiento</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200 mt-3">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Finalidad</th>
                    <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Base jurídica</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border border-gray-200">Prestación del servicio de la plataforma</td>
                    <td className="px-4 py-2 border border-gray-200">Ejecución de un contrato (Art. 6.1.b RGPD)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 border border-gray-200">Gestión de pagos y facturación</td>
                    <td className="px-4 py-2 border border-gray-200">Ejecución de un contrato (Art. 6.1.b RGPD)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-gray-200">Comunicaciones de servicio y soporte técnico</td>
                    <td className="px-4 py-2 border border-gray-200">Interés legítimo (Art. 6.1.f RGPD)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 border border-gray-200">Envío de comunicaciones comerciales</td>
                    <td className="px-4 py-2 border border-gray-200">Consentimiento (Art. 6.1.a RGPD)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-gray-200">Análisis y mejora del servicio</td>
                    <td className="px-4 py-2 border border-gray-200">Interés legítimo (Art. 6.1.f RGPD)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 border border-gray-200">Cumplimiento de obligaciones legales</td>
                    <td className="px-4 py-2 border border-gray-200">Obligación legal (Art. 6.1.c RGPD)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Conservación de los Datos</h2>
            <p>
              Conservaremos tus datos personales mientras mantengas una cuenta activa en la plataforma. Una vez
              solicites la baja, los datos serán bloqueados durante los plazos legales obligatorios (generalmente
              5 años para datos fiscales, 3 años para datos de comunicaciones) y posteriormente eliminados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Destinatarios y Transferencias Internacionales</h2>
            <p>Podemos compartir tus datos con los siguientes terceros:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2 text-sm">
              <li><strong>Cloudflare, Inc.</strong> (EE.UU.) – infraestructura, CDN y almacenamiento cloud. Transferencia cubierta por cláusulas contractuales tipo de la UE.</li>
              <li><strong>Stripe, Inc.</strong> (EE.UU.) – procesamiento de pagos. Adherido al EU-US Data Privacy Framework.</li>
              <li><strong>Resend, Inc.</strong> – envío de correos transaccionales.</li>
              <li><strong>Bunny.net</strong> – distribución de contenido audiovisual.</li>
              <li><strong>Zoom Video Communications, Inc.</strong> (EE.UU.) – clases en directo. Transferencia cubierta por cláusulas contractuales tipo.</li>
            </ul>
            <p className="mt-3">No vendemos ni cedemos tus datos a terceros con fines publicitarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Tus Derechos</h2>
            <p>De acuerdo con el RGPD y la LOPDGDD, puedes ejercer los siguientes derechos:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2 text-sm">
              <li><strong>Acceso:</strong> obtener confirmación sobre si tratamos tus datos y recibir una copia.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión (&quot;derecho al olvido&quot;):</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
              <li><strong>Limitación:</strong> solicitar que suspendamos el tratamiento en determinadas circunstancias.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y de uso común.</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento basado en interés legítimo.</li>
              <li><strong>No ser objeto de decisiones automatizadas.</strong></li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, escríbenos a{' '}
              <a href="mailto:alex@akademo-edu.com" className="text-indigo-600 hover:underline">alex@akademo-edu.com</a>.
              También puedes presentar una reclamación ante la{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                Agencia Española de Protección de Datos (AEPD)
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos frente a accesos
              no autorizados, pérdida, destrucción o divulgación. Estas incluyen cifrado en tránsito (TLS),
              almacenamiento cifrado en reposo, control de acceso basado en roles y auditorías periódicas de
              seguridad. Nuestros sistemas están alojados en la red de Cloudflare con certificación ISO 27001.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies</h2>
            <p>
              Utilizamos cookies técnicas estrictamente necesarias para el funcionamiento del servicio (sesión,
              autenticación). No utilizamos cookies de seguimiento ni de publicidad de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Menores de Edad</h2>
            <p>
              Nuestros servicios no están dirigidos a menores de 14 años. Si detectamos que hemos recopilado
              datos de un menor sin el consentimiento parental verificable, procederemos a eliminarlos
              inmediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta política periódicamente. Te notificaremos de cambios significativos por
              correo electrónico o mediante un aviso prominente en la plataforma. La fecha de última actualización
              aparece al inicio de este documento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contacto</h2>
            <p>
              Para cualquier consulta sobre esta política, contacta con nosotros en{' '}
              <a href="mailto:alex@akademo-edu.com" className="text-indigo-600 hover:underline">alex@akademo-edu.com</a>.
            </p>
          </section>

        </div>

        </main>
      <Footer t={{ footerTagline: 'Protegiendo el conocimiento que creas.', footerRights: '© 2026 AKADEMO. Todos los derechos reservados.' }} lang="es" />
    </div>
  );
}
