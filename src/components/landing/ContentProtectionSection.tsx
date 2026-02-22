interface ContentProtectionSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

export function ContentProtectionSection({ t }: ContentProtectionSectionProps) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full text-emerald-600 text-xs font-semibold uppercase tracking-wide mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Seguridad de Contenido
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {t.contentTitle}
            </h2>
            <p className="text-lg text-gray-500 mb-8">
              {t.contentSubtitle}
            </p>

            <div className="space-y-6">
              <Feature 
                icon={<NoDownloadIcon />}
                title={t.contentFeature1}
                description={t.contentFeature1Desc}
              />
              <Feature 
                icon={<TimerIcon />}
                title={t.contentFeature2}
                description={t.contentFeature2Desc}
              />
              <Feature 
                icon={<LockIcon />}
                title={t.contentFeature3}
                description={t.contentFeature3Desc}
              />
            </div>
          </div>

          {/* Right: Visual */}
          <ProtectedVideoPreview />
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ProtectedVideoPreview() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-cyan-200 rounded-3xl blur-3xl opacity-30" />
      <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-2xl border border-gray-200">
        <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-20 h-20 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {/* Watermark preview */}
          <div className="absolute top-4 left-4 text-white/40 text-xs font-mono">
            student@academy.com
          </div>
          <div className="absolute bottom-4 right-4 text-white/40 text-xs font-mono">
            ID: #12345
          </div>
          {/* Lock overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-6">
            <div className="flex items-center gap-2 text-white text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-medium">Contenido Protegido</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Streaming seguro
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Encriptado
          </span>
        </div>
      </div>
    </div>
  );
}

function NoDownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
