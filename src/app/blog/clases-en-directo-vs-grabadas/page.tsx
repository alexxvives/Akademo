import { getBlogPost, getBlogMetadata } from '@/lib/blog-data';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { notFound } from 'next/navigation';

const post = getBlogPost('clases-en-directo-vs-grabadas');
if (!post) notFound();

export const metadata = getBlogMetadata(post);

export default function BlogPostPage() {
  return (
    <BlogLayout post={post!}>
      <p>
        Cuando alguien decide lanzar una academia online, una de las primeras preguntas que surge es si el contenido 
        debería ser grabado, en directo, o una combinación de ambos. La respuesta correcta depende del tipo de contenido 
        que enseñas y de cómo quieres estructurar tu academia.
      </p>
      <p>
        No hay una respuesta universal, pero sí hay patrones claros que se repiten en academias con buenos resultados.
      </p>

      <h2>Las ventajas del contenido grabado</h2>
      <p>
        El vídeo grabado es la base de la mayoría de academias online de éxito. Sus ventajas son evidentes:
      </p>
      <ul>
        <li><strong>Escalabilidad total</strong> — Grabas una vez y vendes indefinidamente. Tu tiempo no limita tus ingresos</li>
        <li><strong>Calidad controlada</strong> — Puedes editar, mejorar la iluminación, añadir subtítulos y corregir errores</li>
        <li><strong>Disponibilidad 24/7</strong> — El estudiante aprende a su ritmo, cuando mejor le convenga</li>
        <li><strong>Bajo coste operativo</strong> — Una vez creado, el contenido no requiere tu presencia</li>
      </ul>
      <p>
        Funciona especialmente bien para contenido que no caduca: técnicas, fundamentos, habilidades que no cambian con el tiempo. 
        Un curso de fotografía, diseño, programación o idiomas funciona perfectamente en formato grabado.
      </p>

      <h2>Las ventajas de las clases en directo</h2>
      <p>
        Las clases en directo tienen algo que el contenido grabado no puede replicar: la interacción en tiempo real. 
        Esto genera:
      </p>
      <ul>
        <li><strong>Mayor compromiso</strong> — Los estudiantes que saben que hay una clase el jueves a las 18:00 se preparan y asisten</li>
        <li><strong>Comunidad real</strong> — Ver las caras de otros estudiantes crea vínculos que el contenido asíncrono no genera</li>
        <li><strong>Respuesta inmediata</strong> — Las dudas se resuelven en el momento, no tres días después por email</li>
        <li><strong>Percepción de valor más alta</strong> — Los estudiantes suelen valorar más lo que requiere su tiempo en un momento concreto</li>
      </ul>
      <p>
        Las clases en directo son especialmente efectivas para contenido que requiere práctica activa, feedback personalizado 
        o discusión: preparación de oposiciones, coaching, análisis de casos, idiomas conversacionales, terapia, etc.
      </p>

      <h2>Las desventajas de cada modelo</h2>

      <h3>Contenido grabado</h3>
      <ul>
        <li>Sin accountability externo — nadie nota si el estudiante no entra</li>
        <li>Menor sensación de comunidad</li>
        <li>Requiere inversión inicial en producción si quieres calidad decente</li>
      </ul>

      <h3>Clases en directo</h3>
      <ul>
        <li>Tu tiempo sí limita la escala — no puedes enseñar a 1.000 personas en directo con la misma calidad que a 20</li>
        <li>Depende de tu disponibilidad — si no puedes hacer una sesión, los estudiantes lo notan</li>
        <li>Las grabaciones del directo suelen tener peor calidad de producción</li>
        <li>Las franjas horarias excluyen a parte de la audiencia (diferentes zonas horarias)</li>
      </ul>

      <h2>El modelo híbrido: la opción más robusta</h2>
      <p>
        La combinación que mejor funciona en la mayoría de academias con más de 50 estudiantes es:
      </p>
      <ul>
        <li><strong>Contenido base grabado</strong> — El estudiante avanza a su ritmo con lecciones pregrabadas</li>
        <li><strong>Sesiones en directo mensuales o quincenales</strong> — Resolución de dudas, casos prácticos, repaso en grupo</li>
        <li><strong>Grabación de los directos disponible después</strong> — Quien no pudo asistir lo ve igualmente</li>
      </ul>
      <p>
        Este modelo combina la escalabilidad del contenido grabado con la retención y comunidad del directo. Además, 
        justifica precios de suscripción mensuales sin que tengas que crear contenido nuevo constantemente.
      </p>

      <h2>Cómo decidir qué modelo encaja con tu academia</h2>
      <p>
        Hazte estas tres preguntas:
      </p>
      <ul>
        <li><strong>¿Tu contenido caduca?</strong> Si sí, el directo o el híbrido son más adecuados</li>
        <li><strong>¿Tu estudiante necesita feedback personalizado para progresar?</strong> El contenido grabado solo no es suficiente</li>
        <li><strong>¿Quieres escalar a cientos de estudiantes sin aumentar proporcionalmente tu tiempo?</strong> El contenido grabado es indispensable</li>
      </ul>
      <p>
        No hay que elegir para siempre. Muchas academias empiezan con directos (menor inversión inicial, más feedback del mercado) 
        y gradualmente añaden contenido grabado a medida que identifican qué funciona mejor.
      </p>
    </BlogLayout>
  );
}
