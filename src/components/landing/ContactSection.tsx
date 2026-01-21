interface ContactSectionProps {
  lang: 'es' | 'en';
}

export function ContactSection({ lang }: ContactSectionProps) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {lang === 'es' ? 'Hablemos' : "Let's Talk"}
          </h2>
          <p className="text-lg text-gray-600">
            {lang === 'es' 
              ? 'Si diriges una academia y te importa tu contenido, deberíamos conversar.'
              : "If you run an academy and care about your content, we should talk."}
          </p>
        </div>
        
        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'es' ? 'Nombre' : 'Name'}
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={lang === 'es' ? 'Tu nombre' : 'Your name'}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'es' ? 'Email' : 'Email'}
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={lang === 'es' ? 'tu@email.com' : 'your@email.com'}
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'es' ? 'Mensaje' : 'Message'}
            </label>
            <textarea
              id="message"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder={lang === 'es' ? 'Cuéntanos sobre tu academia...' : 'Tell us about your academy...'}
            />
          </div>
          
          <button
            type="submit"
            className="w-full px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
          >
            {lang === 'es' ? 'Enviar Mensaje' : 'Send Message'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-3">
            {lang === 'es' ? 'O escríbenos directamente a' : 'Or email us directly at'}
          </p>
          <a 
            href="mailto:contact@akademo.com"
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            contact@akademo.com
          </a>
        </div>
      </div>
    </section>
  );
}
