import { getBlogPost, getBlogMetadata } from '@/lib/blog-data';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const post = getBlogPost('reducir-abandono-estudiantes-academia');
if (!post) notFound();

export const metadata = getBlogMetadata(post);

export default function BlogPostPage() {
  return (
    <BlogLayout post={post!}>
      <p>
        La tasa de finalización media en cursos online se sitúa en torno al 10-15%. Eso significa que de cada 100 personas 
        que compran tu academia, entre 85 y 90 no llegan al final. Si llevas tiempo en esto, probablemente ya lo sabes. 
        La pregunta es qué hacer al respecto.
      </p>
      <p>
        El abandono tiene consecuencias más allá del aprendizaje del estudiante: genera reembolsos, malas reseñas, 
        y daña las posibilidades de que esa persona vuelva a comprarte en el futuro.
      </p>

      <h2 id="por-que-abandonan">Por qué abandonan los estudiantes</h2>
      <p>
        Antes de hablar de soluciones, es importante entender las causas reales. El abandono casi nunca es porque el contenido 
        sea malo. Las causas más frecuentes son:
      </p>
      <ul>
        <li><strong>Pérdida de motivación</strong> — La emoción inicial se desvanece sin un sistema que la mantenga</li>
        <li><strong>Falta de hábito</strong> — El estudiante quería aprender, pero nunca integró el estudio en su rutina</li>
        <li><strong>Sobrecarga percibida</strong> — El volumen de contenido parece abrumador y no sabe por dónde empezar</li>
        <li><strong>Sin responsabilidad externa</strong> — Nadie nota si completan o no el contenido</li>
        <li><strong>Vida que interrumpe</strong> — Trabajo, familia, vacaciones. Cuando alguien para tres semanas, raramente vuelve</li>
      </ul>

      <h2 id="secuencia-bienvenida">Estrategia 1: la secuencia de bienvenida</h2>
      <p>
        Los primeros tres días después de la compra son los más críticos. El estudiante tiene la motivación en el punto 
        más alto y hay que aprovecharla. Una buena secuencia de bienvenida incluye:
      </p>
      <ul>
        <li>Email de bienvenida con acceso claro y primer paso concreto (no "explora el contenido", sino "empieza con esta lección")</li>
        <li>Mensaje de Whatsapp o email con el segundo día recordando el acceso</li>
        <li>Email al séptimo día si no han completado la primera sección</li>
      </ul>
      <p>
        El objetivo es que el estudiante llegue a la primera victoria rápida: completar una lección, hacer un ejercicio, 
        conseguir un resultado pequeño. Una vez que alguien tiene esa primera victoria, es mucho más probable que continúe.
      </p>

      <h2 id="modulos-cortos">Estrategia 2: dividir el contenido en módulos cortos</h2>
      <p>
        Los cursos largos intimidan. Si tu academia tiene 40 horas de contenido, el estudiante mira el total y siente que 
        nunca va a terminar. La solución no es hacer el contenido más corto, sino estructurarlo de manera que el progreso 
        sea visible y constante.
      </p>
      <p>
        Módulos de 3-7 lecciones funcionan mejor que módulos de 15-20. Cada módulo completado genera una sensación de logro. 
        Considera añadir una evaluación breve o un ejercicio práctico al final de cada módulo para consolidar el aprendizaje y 
        reforzar la sensación de avance.
      </p>

      <h2 id="clases-directo">Estrategia 3: clases en directo periódicas</h2>
      <p>
        Aunque tu academia sea mayoritariamente pregrabada, añadir una sesión en directo mensual o quincenal cambia completamente 
        la dinámica de retención. El directo crea una razón para estar al día: si no has visto el módulo 4, no vas a entender 
        la sesión en directo de la semana que viene.
      </p>
      <p>
        También genera comunidad y sensación de pertenencia, que es uno de los factores más poderosos de retención en academias 
        de largo plazo.
      </p>

      <h2 id="estudiantes-inactivos">Estrategia 4: identificar y contactar estudiantes inactivos</h2>
      <p>
        Si tienes acceso a datos de actividad —qué estudiantes no han entrado en la plataforma en los últimos 14 días— 
        puedes reactivarlos antes de que abandonen definitivamente. Un mensaje personalizado ("Hola Ana, veo que llevas un par 
        de semanas sin conectarte, ¿todo bien?") tiene tasas de respuesta sorprendentemente altas.
      </p>
      <p>
        Con una plataforma como <Link href="/">AKADEMO</Link> puedes ver el estado de actividad de cada estudiante y actuar 
        antes de que el abandono sea definitivo.
      </p>

      <h2 id="comunidad">Estrategia 5: comunidad entre estudiantes</h2>
      <p>
        Los estudiantes que forman vínculos con otros estudiantes de la misma academia abandonan con mucho menos frecuencia. 
        Un grupo de Whatsapp, un canal de Slack, o una sección de foro dentro de la plataforma puede marcar la diferencia. 
        No hace falta que sea muy activo al principio: basta con que exista un espacio donde los estudiantes se sientan 
        parte de algo.
      </p>

      <h2 id="metrica">Una métrica que vale más que la tasa de finalización</h2>
      <p>
        Obsesionarse con la tasa de finalización puede llevar a tomar malas decisiones (acortar el contenido, reducir la 
        dificultad). Una métrica más relevante es la <strong>tasa de renovación o recompra</strong>: ¿cuántos estudiantes 
        vuelven a comprarte otro producto, renuevan la suscripción o te recomiendan? Alguien que completa el 60% de tu 
        curso y consigue resultados es más valioso que alguien que completa el 100% sin aprender nada concreto.
      </p>
    </BlogLayout>
  );
}
