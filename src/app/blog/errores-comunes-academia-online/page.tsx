import { getBlogPost, getBlogMetadata } from '@/lib/blog-data';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { notFound } from 'next/navigation';

const post = getBlogPost('errores-comunes-academia-online');
if (!post) notFound();

export const metadata = getBlogMetadata(post);

export default function BlogPostPage() {
  return (
    <BlogLayout post={post!}>
      <p>
        La mayoría de academias online que desaparecen en su primer año no lo hacen por falta de conocimiento del 
        fundador. Lo hacen por una serie de errores operativos previsibles que se repiten con una frecuencia alarmante.
      </p>
      <p>
        Estos son los cinco errores más comunes y cómo evitarlos antes de que te cuesten tiempo, dinero o reputación.
      </p>

      <h2 id="error-1">Error 1: Esperar a tener el producto perfecto para lanzar</h2>
      <p>
        El síndrome del lanzamiento perfecto destruye más academias que cualquier competidor. El fundador graba, regraba, 
        rediseña y pospone el lanzamiento durante meses. Cuando finalmente lanza, no hay audiencia, no ha validado nada 
        y está agotado.
      </p>
      <p>
        La realidad es que nadie espera que el primer módulo sea producción de Hollywood. Los estudiantes quieren 
        aprender lo que saben que tú sabes. Un contenido correcto lanzado hoy enseña más que un contenido perfecto 
        que se queda en el disco duro.
      </p>
      <p>
        <strong>Solución</strong>: Lanza con la mitad del contenido. Termina el resto mientras los primeros estudiantes 
        avanzan. Su feedback mejorará el producto mejor que cualquier revisión que hagas solo.
      </p>

      <h2 id="error-2">Error 2: Elegir la plataforma equivocada y quedarse atrapado</h2>
      <p>
        Muchas academias empiezan en plataformas de marketplace (Udemy, Teachable, Hotmart) porque son rápidas de 
        configurar. El problema aparece cuando:
      </p>
      <ul>
        <li>La plataforma se queda con un porcentaje importante de cada venta</li>
        <li>No tienes acceso a los datos de tus estudiantes</li>
        <li>No puedes personalizar la experiencia a tu imagen de marca</li>
        <li>Tus estudiantes no son tuyos: son de la plataforma</li>
      </ul>
      <p>
        <strong>Solución</strong>: Elige desde el principio una plataforma donde seas el dueño de la relación con 
        el estudiante. Los datos de tus estudiantes son uno de los activos más valiosos de tu academia.
      </p>

      <h2 id="error-3">Error 3: Ignorar la retención y centrarse solo en la captación</h2>
      <p>
        Captar un estudiante nuevo cuesta entre cinco y diez veces más que retener uno. Sin embargo, la mayoría de 
        academias dedican el 90% de su energía a conseguir nuevas matriculaciones y prácticamente cero a mantener 
        a los que ya tienen.
      </p>
      <p>
        El resultado: una rueda de hámster donde necesitas captar constantemente solo para mantenerte estable.
      </p>
      <p>
        <strong>Solución</strong>: Mide la tasa de renovación mensual desde el primer día. Si está por debajo del 
        70%, hay un problema de producto que resolver antes de invertir más en captación.
      </p>

      <h2 id="error-4">Error 4: No proteger el contenido que has creado</h2>
      <p>
        Dedicar meses a crear un curso y luego distribuirlo sin ninguna protección es uno de los errores más costosos. 
        El contenido sin proteger acaba compartido en grupos de Telegram, foros o simplemente pasado de cuenta en cuenta.
      </p>
      <p>
        Cuando esto ocurre, no solo pierdes ingresos directos — también desaparece el incentivo de los estudiantes 
        actuales para mantener su suscripción, porque saben que el contenido puede conseguirse gratis.
      </p>
      <p>
        <strong>Solución</strong>: Implementa acceso por cuenta individual con detección de cuentas compartidas. 
        Una academia que controla quién tiene acceso a qué puede aplicar su política de uso y proteger el trabajo 
        que ha costado crear.
      </p>

      <h2 id="error-5">Error 5: Fijar precios sin estrategia</h2>
      <p>
        El precio de una academia online no debería calcularse en base a "lo que parece justo" o a lo que cobran otros. 
        Dos errores frecuentes:
      </p>
      <ul>
        <li><strong>Precio demasiado bajo</strong> — Señala poca calidad, atrae estudiantes poco comprometidos y hace 
        insostenible el negocio</li>
        <li><strong>Precio muy alto sin proporcionar el valor percibido correspondiente</strong> — Genera refundos y 
        comentarios negativos</li>
      </ul>
      <p>
        <strong>Solución</strong>: El precio debe comunicar el valor del resultado que el estudiante va a conseguir, 
        no el tiempo que tardaste en crear el contenido. Un curso que ayuda a alguien a pasar una oposición o a 
        conseguir un cliente puede valer varios cientos de euros. Uno que enseña una habilidad casual puede valer 
        30 euros. El valor que genera es lo que manda.
      </p>

      <h2 id="denominador-comun">El denominador común</h2>
      <p>
        Si analizas estos cinco errores, todos tienen algo en común: provienen de tomar decisiones sin datos 
        ni sistema. Las academias que prosperan a largo plazo son las que miden, ajustan y construyen estructura 
        antes de escalar.
      </p>
      <p>
        El conocimiento que tienes para enseñar es valioso. El reto está en construir alrededor de ese conocimiento 
        una operación que sea sostenible.
      </p>
    </BlogLayout>
  );
}
