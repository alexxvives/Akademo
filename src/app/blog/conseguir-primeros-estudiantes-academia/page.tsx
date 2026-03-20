import { getBlogPost, getBlogMetadata } from '@/lib/blog-data';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { notFound } from 'next/navigation';

const post = getBlogPost('conseguir-primeros-estudiantes-academia');
if (!post) notFound();

export const metadata = getBlogMetadata(post);

export default function BlogPostPage() {
  return (
    <BlogLayout post={post!}>
      <p>
        Los primeros cien estudiantes son los más difíciles de conseguir. No porque sea imposible, sino porque 
        en esa fase no tienes reseñas, no tienes casos de éxito y el algoritmo de ninguna plataforma te favorece.
        Todo lo que tienes es tu conocimiento y tu capacidad para transmitir que vale la pena.
      </p>
      <p>
        Estas son las acciones más efectivas para pasar de cero a cien estudiantes, ordenadas por esfuerzo y retorno.
      </p>

      <h2 id="paso-1-red">Paso 1: Empieza con tu red directa</h2>
      <p>
        El primer punto de contacto no es Instagram ni Google Ads. Es el móvil que ya tienes.
      </p>
      <p>
        Haz una lista de 50 personas que conozcan tu área de conocimiento y envía un mensaje personalizado a cada una. 
        No es spam masivo: es una conversación real. Algo tan sencillo como &ldquo;Estoy lanzando una academia sobre [tema], 
        creo que puede interesarte o que conoces a alguien a quien le podría venir bien. ¿Puedo contarte más?&rdquo;
      </p>
      <p>
        No cierres ventas directamente. Cierra conversaciones. De esas 50 conversaciones, una parte pequeña se convertirá 
        en estudiantes tempranos y el resto te dará referencias.
      </p>

      <h2 id="paso-2-contenido">Paso 2: Publica contenido de valor antes de pedir nada</h2>
      <p>
        Elige un canal donde ya tengas alguna presencia aunque sea mínima (LinkedIn, Instagram, YouTube, un grupo de 
        WhatsApp o Telegram, un foro especializado) y publica contenido útil durante cuatro semanas antes de mencionar 
        la academia.
      </p>
      <p>
        La regla es sencilla: diez publicaciones de valor por cada una de venta. Las personas compran a quien les ha 
        enseñado algo. Si alguien ha aprendido tres cosas gratis contigo, cuando ofrezcas algo de pago tiene sentido.
      </p>
      <p>
        El contenido no tiene que ser elaborado. Una respuesta a una pregunta frecuente de tu sector, un error común 
        que ves constantemente, un proceso que haces diferente. Lo que saben que tú sabes es lo que les da confianza.
      </p>

      <h2 id="paso-3-demo">Paso 3: Haz una sesión gratuita de demostración</h2>
      <p>
        Organiza una clase o webinar gratuito sobre un tema concreto y específico. No &ldquo;introducción a la contabilidad&rdquo;. 
        Algo como &ldquo;Los tres errores de contabilidad que cometen autónomos en su primer año y que les generan problemas 
        con Hacienda&rdquo;.
      </p>
      <p>
        Al final de la sesión, presenta la academia. No de forma agresiva: simplemente explica que para quien quiera 
        ir más lejos, existe este recurso. Los participantes ya han experimentado cómo enseñas y si les ha aportado 
        valor, algunos darán el paso.
      </p>
      <p>
        Esta técnica funciona porque convierte al espectador en alguien que ya confía en ti, no en un desconocido 
        al que estás intentando vender.
      </p>

      <h2 id="paso-4-condiciones">Paso 4: Ofrece condiciones especiales para los primeros matriculados</h2>
      <p>
        Los primeros estudiantes asumen un riesgo mayor que los que llegan cuando ya hay reseñas y testimonios. 
        Reconócelo. Puedes ofrecerles:
      </p>
      <ul>
        <li>Precio de lanzamiento inferior durante los primeros 30 días</li>
        <li>Acceso de por vida si es un producto de pago único</li>
        <li>Sesiones de feedback directas contigo</li>
        <li>Influencia sobre el contenido futuro: si preguntan qué quieren, se lo dices y lo incorporas</li>
      </ul>
      <p>
        No se trata de malvender. Se trata de compensar a quienes confían cuando no hay datos históricos que lo 
        justifiquen. Estos primeros estudiantes también son los que generarán los primeros testimonios.
      </p>

      <h2 id="paso-5-referencias">Paso 5: Pide referencias activamente</h2>
      <p>
        El error más frecuente es esperar a que las referencias lleguen solas. No llegan.
      </p>
      <p>
        A los dos o tres semanas de que un estudiante se matricule, envíale un mensaje directo: &ldquo;¿Cómo lo llevas? 
        ¿Hay alguien en tu entorno que creas que podría beneficiarse de algo parecido?&rdquo; Una pregunta sencilla y 
        directa genera más referencias que cualquier programa de afiliados complejo.
      </p>
      <p>
        Si tienes diez estudiantes y cada uno refiere a una persona, ya tienes veinte. Si la mitad del segundo grupo 
        también refiere, estarás cerca de treinta sin haber invertido un euro en publicidad.
      </p>

      <h2 id="lo-que-no-funciona">Lo que no funciona en esta fase</h2>
      <p>
        Antes de los cien estudiantes, invierte tu energía en canales directos. Son cosas que no suelen funcionar 
        bien en esta fase:
      </p>
      <ul>
        <li>Publicidad de pago sin audiencia validada previa</li>
        <li>SEO (tarda meses en dar resultados)</li>
        <li>Programas de afiliados cuando no tienes producto validation</li>
        <li>Presencia en múltiples redes sociales a la vez</li>
      </ul>
      <p>
        Los primeros cien estudiantes se consiguen con contacto directo, contenido específico y demostraciones de 
        valor concretas. Cuando ya tengas esa base, inviertes en canales que escalan.
      </p>

      <h2 id="objetivo-real">El objetivo real</h2>
      <p>
        Los primeros 100 estudiantes no son solo ingresos. Son testimonios, casos prácticos, feedback sobre qué 
        funciona y qué no, y la prueba social que necesitas para que el siguiente paso (publicidad, partnerships, 
        SEO) funcione mucho mejor.
      </p>
      <p>
        Trátalos como los socios fundadores de tu academia y actuarán como tal.
      </p>
    </BlogLayout>
  );
}
