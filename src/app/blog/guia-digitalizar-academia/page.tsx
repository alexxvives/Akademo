import { getBlogPost, getBlogMetadata } from '@/lib/blog-data';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const post = getBlogPost('guia-digitalizar-academia');
if (!post) notFound();

export const metadata = getBlogMetadata(post);

export default function BlogPostPage() {
  return (
    <BlogLayout post={post!}>
      <p>
        La transformación digital de las academias ya no es una opción — es una necesidad. Ya sea que dirijas una 
        academia de idiomas, música, oposiciones o formación profesional, llevar tu oferta al mundo online abre 
        la puerta a más estudiantes, mayor flexibilidad y ingresos recurrentes.
      </p>
      <p>
        En esta guía te llevamos paso a paso por todo lo que necesitas para digitalizar tu academia en 2026.
      </p>

      <h2>Paso 1: Define tu estructura académica</h2>
      <p>
        Antes de grabar un solo vídeo, necesitas planificar:
      </p>
      <ul>
        <li><strong>Asignaturas o cursos</strong> — ¿Qué vas a enseñar? Organiza por materias o niveles</li>
        <li><strong>Estructura de clases</strong> — Módulos, temas, lecciones individuales</li>
        <li><strong>Roles</strong> — ¿Quiénes son tus profesores? ¿Cada uno gestiona sus propias clases?</li>
        <li><strong>Modelo de pago</strong> — Suscripción mensual, pago por curso, o paquetes</li>
      </ul>
      <p>
        Un software de gestión como <Link href="/">AKADEMO</Link> te permite crear esta estructura 
        directamente: academias, clases, profesores y estudiantes organizados por roles con permisos claros.
      </p>

      <h2>Paso 2: Graba contenido de calidad</h2>
      <p>
        No necesitas un estudio profesional. Con estas herramientas puedes empezar:
      </p>
      <ul>
        <li><strong>Cámara</strong> — Tu webcam o la cámara del móvil (1080p mínimo)</li>
        <li><strong>Micrófono</strong> — Un micrófono USB de 30-50€ marca la diferencia</li>
        <li><strong>Software de grabación</strong> — OBS Studio (gratis) o Loom para clases rápidas</li>
        <li><strong>Iluminación</strong> — Luz natural o un aro de luz básico</li>
      </ul>
      <p>
        Consejo: graba vídeos cortos (10-20 minutos) por tema. Los estudiantes prefieren lecciones cortas y 
        enfocadas que puedan repasar fácilmente.
      </p>

      <h2>Paso 3: Elige tu plataforma</h2>
      <p>
        Hay tres categorías de plataformas para academias online:
      </p>
      <h3>LMS genéricos (Moodle, Canvas)</h3>
      <p>
        Diseñados para universidades. Potentes pero complejos, requieren servidor propio y 
        mantenimiento técnico. No incluyen protección de contenido.
      </p>
      <h3>Plataformas de cursos (Teachable, Thinkific)</h3>
      <p>
        Fáciles de usar para un profesor individual. Pero limitadas para academias con múltiples profesores, 
        sin protección anti-piratería y con comisiones por venta.
      </p>
      <h3>Plataformas para academias (AKADEMO)</h3>
      <p>
        Diseñadas específicamente para academias: gestión de múltiples profesores, protección de contenido con 
        marca de agua, control de cuentas compartidas, clases en directo con Zoom, y gestión de pagos. 
        Todo en uno.
      </p>

      <h2>Paso 4: Sube y organiza tu contenido</h2>
      <p>
        Una vez elegida la plataforma:
      </p>
      <ul>
        <li>Sube los vídeos organizados por asignaturas y temas</li>
        <li>Añade material complementario (PDFs, ejercicios, cuestionarios)</li>
        <li>Configura el orden de las lecciones</li>
        <li>Activa la protección: marca de agua, streaming sin descarga</li>
      </ul>

      <h2>Paso 5: Invita a tu equipo</h2>
      <p>
        Si tienes profesores, dales acceso con el rol adecuado. Cada profesor debería poder:
      </p>
      <ul>
        <li>Gestionar sus propias asignaturas y vídeos</li>
        <li>Ver el progreso de sus estudiantes</li>
        <li>Programar y lanzar clases en directo</li>
        <li>NO tener acceso al contenido de otros profesores</li>
      </ul>

      <h2>Paso 6: Configura los pagos</h2>
      <p>
        Para cobrar automáticamente, necesitas una pasarela de pago. <strong>Stripe</strong> es la opción más 
        popular para academias en Europa y Latinoamérica: soporta tarjetas, domiciliación bancaria y múltiples 
        monedas.
      </p>
      <p>
        Si prefieres gestionar los pagos manualmente (transferencia, Bizum, efectivo), tu plataforma debería 
        permitirte marcar quién ha pagado y quién no.
      </p>

      <h2>Paso 7: Lanza y mantén clases en directo</h2>
      <p>
        Las clases en directo son un diferenciador clave. Los estudiantes valoran la interacción en tiempo real 
        con el profesor. Integra <strong>Zoom</strong> para:
      </p>
      <ul>
        <li>Programar sesiones recurrentes</li>
        <li>Grabar automáticamente y subir a la plataforma</li>
        <li>Aplicar marca de agua incluso en las grabaciones en vivo</li>
      </ul>

      <h2>Paso 8: Migra tus estudiantes existentes</h2>
      <p>
        Si ya tienes estudiantes en otra plataforma o en hojas de cálculo, necesitas un proceso de migración. 
        Lo ideal es una <strong>importación CSV masiva</strong> que cree las cuentas automáticamente y genere 
        contraseñas temporales que puedas enviar a cada estudiante.
      </p>

      <h2>Conclusión</h2>
      <p>
        Digitalizar tu academia requiere planificación, pero no tiene que ser complicado. Con la plataforma 
        adecuada, puedes tener tu academia online funcionando en cuestión de días, no meses.
      </p>
      <p>
        <Link href="/">AKADEMO</Link> fue diseñado para hacer exactamente esto: simplificar la transición 
        de academias presenciales al mundo online, con todas las herramientas que necesitas desde el primer día.
      </p>
    </BlogLayout>
  );
}
