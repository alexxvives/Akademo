import { getBlogPost, getBlogMetadata } from '@/lib/blog-data';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const post = getBlogPost('como-fijar-precio-academia-online');
if (!post) notFound();

export const metadata = getBlogMetadata(post);

export default function BlogPostPage() {
  return (
    <BlogLayout post={post!}>
      <p>
        Fijar el precio de una academia online es una de las decisiones más importantes que tomarás, y una de las que más 
        se suele hacer mal. La mayoría de creadores de academias cobran demasiado poco por miedo a no conseguir estudiantes. 
        El resultado: trabajan el doble para ganar lo mismo que podrían con la mitad de alumnos si el precio fuera el correcto.
      </p>

      <h2>El error de fijar el precio por el tiempo que tardaste en crear el contenido</h2>
      <p>
        El precio no debería estar basado en el número de horas de vídeo que tienes ni en el tiempo que tardaste en grabarlos. 
        Está basado en el valor que genera para el estudiante. Un curso de 4 horas que enseña a alguien a conseguir un trabajo 
        mejor pagado vale objetivamente más que 20 horas de contenido que no cambia nada en la vida de quien lo consume.
      </p>
      <p>
        Antes de fijar cualquier número, hazte esta pregunta: <strong>¿qué problema concreto resuelve esta academia, 
        y cuánto vale resolver ese problema para el estudiante?</strong>
      </p>

      <h2>Los tres modelos de precios más comunes</h2>

      <h3>1. Pago único por curso</h3>
      <p>
        El modelo más sencillo. El estudiante paga una vez y accede al contenido de forma permanente. Funciona bien cuando 
        el contenido es estable y no requiere actualizaciones frecuentes. El precio típico en academias españolas oscila 
        entre 97€ y 497€ para cursos especializados.
      </p>

      <h3>2. Suscripción mensual o anual</h3>
      <p>
        El modelo más potente para generar ingresos recurrentes predecibles. El estudiante paga cada mes por acceso continuo. 
        Ideal si publicas contenido nuevo regularmente o si ofreces sesiones en directo, tutorías o comunidad activa. 
        El precio habitual va de 19€ a 99€ al mes.
      </p>
      <p>
        La variante anual (con 2 meses gratis) suele aumentar el valor de vida del cliente en un 40-60% respecto al mensual.
      </p>

      <h3>3. Modelo híbrido: suscripción + upsell</h3>
      <p>
        Una suscripción base de acceso a contenido grabado, con la opción de pagar más por sesiones en directo, corrección 
        personalizada o acceso al profesor. Es el modelo con mayor potencial de ingresos y el que better se adapta a 
        academias de formación profesional.
      </p>

      <h2>Cómo saber si tu precio es demasiado bajo</h2>
      <p>
        Hay un indicador claro: si más del 60% de las personas a quienes presentas tu academia la compran sin pensarlo mucho, 
        tu precio probablemente es bajo. Un buen precio tiene algo de fricción. Si nadie objeta el precio, estás regalando valor.
      </p>
      <ul>
        <li><strong>Tasa de conversión superior al 50%</strong> — señal de precio bajo</li>
        <li><strong>Tasa de conversión entre 10% y 30%</strong> — rango saludable</li>
        <li><strong>Nadie compra</strong> — el problema probablemente no es el precio, sino el posicionamiento</li>
      </ul>

      <h2>Estrategias para aumentar el precio percibido</h2>
      <p>
        No siempre tienes que bajar el precio para vender más. A veces basta con cambiar cómo lo presentas:
      </p>
      <ul>
        <li><strong>Comparativa de coste</strong> — "Este curso cuesta lo mismo que dos clases particulares y te da acceso durante un año"</li>
        <li><strong>ROI explícito</strong> — Si aprendes X habilidad, puedes cobrar Y más al mes. La academia se paga en Z semanas</li>
        <li><strong>Precio anclado</strong> — Mostrar primero el plan más caro hace que el plan medio parezca razonable</li>
        <li><strong>Garantía de devolución</strong> — Reduce el riesgo percibido y suele aumentar las ventas aunque casi nadie la use</li>
      </ul>

      <h2>La trampa de los descuentos permanentes</h2>
      <p>
        Muchas academias entran en un ciclo de descuentos constantes: lanzan con precio normal, las ventas bajan, hacen 
        descuento del 50%, las ventas suben, el descuento se convierte en el precio real. Resultado: han entrenado a sus 
        estudiantes a esperar ofertas y han destruido la percepción de valor de su producto.
      </p>
      <p>
        Si quieres hacer descuentos, hazlos puntuales, con motivo real (lanzamiento, temporada, aniversario) y con 
        <strong>fecha de vencimiento visible</strong>. Un descuento sin fecha límite no motiva la compra, solo baja el precio.
      </p>

      <h2>Un punto de partida práctico</h2>
      <p>
        Si estás empezando y no sabes por dónde empezar, aquí tienes una guía orientativa según el tipo de contenido:
      </p>
      <ul>
        <li><strong>Cursos de hobby o interés personal</strong> — 29€ a 99€ pago único</li>
        <li><strong>Formación profesional o técnica</strong> — 197€ a 497€ pago único, o 29€/mes</li>
        <li><strong>Formación con certificación o acompañamiento</strong> — 497€ a 2.000€+ o suscripción de 49-149€/mes</li>
        <li><strong>Academia con comunidad activa y directo regular</strong> — 29€ a 79€/mes</li>
      </ul>
      <p>
        Lo más importante: pon un precio, pruébalo con tus primeros estudiantes, analiza la conversión, y ajusta. 
        No existe el precio perfecto calculado en una hoja de cálculo. Existe el precio que el mercado valida.
      </p>
    </BlogLayout>
  );
}
