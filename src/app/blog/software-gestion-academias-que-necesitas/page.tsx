import { getBlogPost, getBlogMetadata } from '@/lib/blog-data';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const post = getBlogPost('software-gestion-academias-que-necesitas');
if (!post) notFound();

export const metadata = getBlogMetadata(post);

export default function BlogPostPage() {
  return (
    <BlogLayout post={post!}>
      <p>
        Gestionar una academia es mucho más que dar clases. Matrículas, pagos, horarios, contenido, 
        comunicación con estudiantes, control de asistencia... Sin las herramientas adecuadas, el trabajo 
        administrativo consume más tiempo que la enseñanza.
      </p>
      <p>
        En este artículo analizamos qué funcionalidades debe tener un software de gestión para academias 
        y cómo elegir el que mejor se adapte a tu centro.
      </p>

      <h2 id="que-incluir">¿Qué debe incluir un buen software de gestión?</h2>
      <p>
        Independientemente del tamaño de tu academia, hay funciones esenciales que todo software debería cubrir:
      </p>

      <h3>1. Gestión de estudiantes y matrículas</h3>
      <p>
        La base de cualquier academia: poder registrar estudiantes, asignarlos a clases, y tener un historial 
        completo de cada alumno. Necesitas:
      </p>
      <ul>
        <li>Registro con datos de contacto y perfil</li>
        <li>Asignación a una o varias clases</li>
        <li>Estado de matrícula (activa, pendiente, cancelada)</li>
        <li>Historial de asistencia y progreso</li>
      </ul>

      <h3>2. Gestión de profesores y roles</h3>
      <p>
        Si tienes más de un profesor, necesitas un sistema de permisos. Cada profesor debería poder gestionar 
        sus clases sin ver ni modificar las de otros. El administrador (dueño de la academia) necesita una 
        vista global de todo.
      </p>

      <h3>3. Contenido educativo (LMS)</h3>
      <p>
        Un sistema de gestión de aprendizaje integrado te permite:
      </p>
      <ul>
        <li>Subir vídeos organizados por lecciones y temas</li>
        <li>Compartir PDFs, ejercicios y material complementario</li>
        <li>Programar la publicación de contenido (fechas de liberación)</li>
        <li>Evaluar con cuestionarios y tests</li>
      </ul>

      <h3>4. Clases en directo</h3>
      <p>
        La formación online necesita sesiones en vivo para dudas, tutorías y clases magistrales. Una integración 
        con <strong>Zoom</strong> u otra plataforma de videoconferencia es imprescindible. Lo ideal: que las 
        sesiones se graben automáticamente y se publiquen como lecciones.
      </p>

      <h3>5. Gestión de pagos</h3>
      <p>
        Cobrar manualmente y perseguir recibos es insostenible. Un buen software debería ofrecer:
      </p>
      <ul>
        <li>Integración con <strong>Stripe</strong> u otra pasarela de pago</li>
        <li>Cobros automáticos por clase o suscripción</li>
        <li>Panel de pagos para ver quién ha pagado y quién no</li>
        <li>Opción de pago manual para centros que prefieren transferencia o efectivo</li>
      </ul>

      <h3>6. Protección de contenido</h3>
      <p>
        Si vendes contenido premium, necesitas protegerlo. Las funciones clave son:
      </p>
      <ul>
        <li><Link href="/blog/marca-de-agua-videos-educativos">Marca de agua dinámica</Link> con nombre del estudiante</li>
        <li><Link href="/blog/cuentas-compartidas-problema-academias">Control de sesiones simultáneas</Link> (evitar cuentas compartidas)</li>
        <li>Streaming sin opción de descarga</li>
        <li>Detección de comportamientos sospechosos</li>
      </ul>

      <h3>7. Comunicación y notificaciones</h3>
      <p>
        Los estudiantes necesitan recibir avisos de nuevas lecciones, clases programadas y actualizaciones. 
        Un sistema de notificaciones integrado (email + in-app) ahorra horas de gestión manual.
      </p>

      <h2 id="comparativa">Comparativa de opciones en 2026</h2>

      <h3>Google Classroom (Gratis)</h3>
      <p>
        Ideal para escuelas públicas. Gratuito y simple, pero sin gestión de pagos, sin protección de contenido, 
        sin personalización de marca. No apto para academias que cobran por sus servicios.
      </p>

      <h3>Moodle (Open Source)</h3>
      <p>
        El LMS más potente del mercado. Infinitamente personalizable pero requiere servidor propio, 
        administrador técnico y semanas de configuración. Sin protección de vídeo integrada. 
        Ideal para universidades con equipo de IT.
      </p>

      <h3>Teachable / Thinkific</h3>
      <p>
        Plataformas de cursos online populares. Fáciles de usar para un instructor individual. Limitaciones: 
        cobran comisiones por venta, gestión limitada de múltiples profesores, sin marca de agua, 
        sin control de cuentas compartidas.
      </p>

      <h3>ClassApp / Alexia</h3>
      <p>
        Software de gestión administrativa (matrículas, horarios, facturación). Buenos para la parte 
        administrativa pero no incluyen LMS, streaming de vídeo ni clases en directo.
      </p>

      <h3>AKADEMO</h3>
      <p>
        Plataforma todo-en-uno diseñada para academias: gestión de estudiantes, profesores y pagos + LMS 
        con vídeo protegido + clases en directo con Zoom + marca de agua dinámica + control de 
        cuentas compartidas. Sin comisiones por venta. 
        <Link href="/pricing">Ver precios</Link>.
      </p>

      <h2 id="como-elegir">Cómo elegir el software correcto</h2>
      <p>
        Hazte estas preguntas:
      </p>
      <ul>
        <li><strong>¿Cobras por tu contenido?</strong> → Necesitas protección y gestión de pagos</li>
        <li><strong>¿Tienes más de un profesor?</strong> → Necesitas roles y permisos</li>
        <li><strong>¿Das clases en directo?</strong> → Necesitas integración con videoconferencia</li>
        <li><strong>¿Tienes contenido en vídeo?</strong> → Necesitas streaming protegido</li>
        <li><strong>¿Quieres crecer sin complicaciones técnicas?</strong> → Necesitas una plataforma gestionada</li>
      </ul>
      <p>
        Si respondiste sí a la mayoría, necesitas una plataforma integral, no un conjunto de herramientas 
        separadas que no se comunican entre sí.
      </p>

      <h2 id="coste-del-gratis">El coste real del &quot;gratis&quot;</h2>
      <p>
        Muchas academias empiezan con herramientas gratuitas: Google Classroom + Zoom gratuito + WhatsApp 
        para comunicación + Excel para pagos. Esto funciona con 10 estudiantes. Con 50+ estudiantes, 
        la gestión manual consume horas diarias del equipo.
      </p>
      <p>
        El coste de un software profesional se paga solo con el tiempo ahorrado en administración y con 
        los ingresos recuperados al evitar piratería de contenido.
      </p>

      <h2 id="conclusion">Conclusión</h2>
      <p>
        El software de gestión ideal para tu academia depende de tu situación, pero en 2026 ya no es aceptable 
        gestionar todo manualmente. La tecnología existe para automatizar la administración, proteger tu 
        contenido y ofrecer una experiencia profesional a tus estudiantes.
      </p>
      <p>
        Invierte en la herramienta correcta y dedica tu tiempo a lo que realmente importa: <strong>enseñar</strong>.
      </p>
    </BlogLayout>
  );
}
