import { getBlogPost, getBlogMetadata } from '@/lib/blog-data';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const post = getBlogPost('seo-academias-online-atraer-estudiantes-google');
if (!post) notFound();

export const metadata = getBlogMetadata(post);

export default function BlogPostPage() {
  return (
    <BlogLayout post={post!}>
      <p>
        El <strong>68% de los estudiantes</strong> que buscan formación online empiezan en Google. Si tu academia
        no aparece en los primeros resultados, estás regalando estudiantes a la competencia. La buena
        noticia: el SEO para academias sigue unas reglas claras y accionables.
      </p>

      <h2 id="seo-vs-publicidad">Por qué el SEO es más rentable que la publicidad</h2>
      <p>
        Un anuncio en Google Ads deja de traer tráfico en cuanto dejas de pagar. Un artículo bien
        posicionado sigue atrayendo estudiantes durante meses o años. Para una academia online,
        el <strong>coste por adquisición orgánico</strong> es entre 5 y 10 veces menor que el de pago.
      </p>
      <p>
        Además, los estudiantes que llegan por búsqueda orgánica ya tienen intención de compra: están
        buscando activamente lo que tú ofreces.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80"
        alt="Dashboard de analíticas web mostrando crecimiento de tráfico"
        className="rounded-xl shadow-lg my-8"
      />

      <h2 id="palabras-clave">1. Investiga las palabras clave correctas</h2>
      <p>
        No compitas por términos genéricos como &quot;cursos online&quot;. En su lugar, apunta a
        palabras clave de cola larga específicas de tu nicho:
      </p>
      <ul>
        <li><strong>Genérico (difícil)</strong>: &quot;academia de inglés online&quot;</li>
        <li><strong>Específico (alcanzable)</strong>: &quot;academia de inglés online para empresas B2B&quot;</li>
        <li><strong>Long tail (fácil)</strong>: &quot;preparar examen Cambridge B2 online con profesor nativo&quot;</li>
      </ul>
      <p>
        Herramientas gratuitas como Google Keyword Planner, Ubersuggest o AnswerThePublic te muestran
        exactamente qué buscan tus potenciales estudiantes.
      </p>

      <h2 id="contenido">2. Crea contenido que responda preguntas reales</h2>
      <p>
        El mejor contenido SEO para academias no es promocional — es educativo. Artículos que resuelven
        problemas reales de tu audiencia:
      </p>
      <ul>
        <li>Guías paso a paso sobre temas de tu sector</li>
        <li>Comparativas entre métodos o herramientas</li>
        <li>Respuestas a preguntas frecuentes de tus estudiantes</li>
        <li>Estudios de caso y resultados de tus alumnos</li>
      </ul>
      <p>
        Cada artículo debería apuntar a una <strong>palabra clave principal</strong> y varias secundarias
        relacionadas. Los artículos entre 1.500 y 2.500 palabras tienden a posicionar mejor según
        múltiples estudios de SEO.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1000&q=80"
        alt="Persona escribiendo contenido en un portátil con café"
        className="rounded-xl shadow-lg my-8"
      />

      <h2 id="paginas-cursos">3. Optimiza las páginas de tus cursos</h2>
      <p>
        Cada clase o curso de tu academia debería tener su propia página optimizada. Los elementos
        clave son:
      </p>
      <ul>
        <li><strong>Título H1</strong> con la palabra clave principal del curso</li>
        <li><strong>Meta description</strong> persuasiva de 150-160 caracteres</li>
        <li><strong>Contenido descriptivo</strong> de al menos 300 palabras explicando qué aprenderá el estudiante</li>
        <li><strong>Testimonios</strong> de alumnos anteriores (Google valora el contenido de terceros)</li>
        <li><strong>Schema markup</strong> de tipo Course para resultados enriquecidos</li>
      </ul>

      <h2 id="seo-tecnico">4. SEO técnico: lo que Google ve pero tú no</h2>
      <p>
        La velocidad y estructura técnica importan tanto como el contenido:
      </p>
      <ul>
        <li><strong>Velocidad de carga</strong> — Tu web debe cargar en menos de 3 segundos. Cada segundo extra reduce las conversiones un 20%</li>
        <li><strong>Mobile first</strong> — Google indexa la versión móvil primero. Tu academia debe funcionar perfectamente en el móvil</li>
        <li><strong>HTTPS</strong> — Imprescindible para cualquier web que maneje datos de estudiantes</li>
        <li><strong>Sitemap XML</strong> — Ayuda a Google a descubrir todas tus páginas</li>
      </ul>

      <h2 id="autoridad-enlaces">5. Construye autoridad con enlaces</h2>
      <p>
        Los backlinks siguen siendo uno de los factores más importantes de posicionamiento.
        Estrategias que funcionan para academias:
      </p>
      <ul>
        <li><strong>Guest posting</strong> en blogs del sector educativo</li>
        <li><strong>Directorios de formación</strong> donde listar tu academia</li>
        <li><strong>Colaboraciones con profesionales</strong> que enlacen a tus cursos</li>
        <li><strong>Contenido referenciable</strong> — estadísticas originales, infografías y estudios</li>
      </ul>

      <h2 id="mide-ajusta">6. Mide y ajusta cada mes</h2>
      <p>
        El SEO no es una acción puntual sino un proceso continuo. Revisa mensualmente:
      </p>
      <ul>
        <li><strong>Google Search Console</strong> — Qué consultas traen tráfico y cuáles tienen potencial</li>
        <li><strong>Posiciones</strong> — Si tus artículos suben o bajan en los resultados</li>
        <li><strong>Conversiones orgánicas</strong> — Cuántos estudiantes se inscriben desde búsqueda</li>
      </ul>
      <p>
        Con una estrategia SEO constante, tu academia puede convertir Google en su principal
        fuente de nuevos estudiantes. Plataformas como <Link href="/">AKADEMO</Link> ya están
        optimizadas técnicamente para SEO, permitiéndote centrarte en crear el mejor contenido
        para tu audiencia.
      </p>
    </BlogLayout>
  );
}
