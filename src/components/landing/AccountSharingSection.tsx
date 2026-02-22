interface AccountSharingSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

export function AccountSharingSection({ t }: AccountSharingSectionProps) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wide border border-emerald-500/20 mb-6">
            Protección Activa
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t.sharingTitle}
          </h2>
          <p className="text-lg text-gray-400 italic max-w-4xl mx-auto">
            &ldquo;{t.sharingSubtitle}&rdquo;
          </p>
        </div>
        
        <div className="grid sm:grid-cols-3 gap-8">
          <FeatureCard 
            stat="99.9%"
            statLabel="Tasa de detección"
            title={t.sharingFeature1}
            description={t.sharingFeature1Desc}
            icon={<SingleSessionIcon />}
            gradient="from-blue-500 to-blue-600"
          />
          <FeatureCard 
            stat="<1s"
            statLabel="Tiempo de respuesta"
            title={t.sharingFeature2}
            description={t.sharingFeature2Desc}
            icon={<DetectionIcon />}
            gradient="from-purple-500 to-purple-600"
          />
          <FeatureCard 
            stat="24/7"
            statLabel="Monitoreo activo"
            title={t.sharingFeature3}
            description={t.sharingFeature3Desc}
            icon={<AlertIcon />}
            gradient="from-pink-500 to-rose-500"
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  stat: string;
  statLabel: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

function FeatureCard({ stat, statLabel, title, description, icon, gradient }: FeatureCardProps) {
  return (
    <div className="group h-full">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 hover:border-emerald-500/30 transition-all hover:shadow-2xl hover:shadow-emerald-500/10 h-full flex flex-col">
        <div className="flex items-start justify-between mb-6">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-bold text-white">{stat}</div>
            <div className="text-xs text-gray-400 mt-1">{statLabel}</div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed flex-1">{description}</p>
      </div>
    </div>
  );
}

function SingleSessionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function DetectionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
