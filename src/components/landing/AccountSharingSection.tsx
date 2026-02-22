interface AccountSharingSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

export function AccountSharingSection({ t }: AccountSharingSectionProps) {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur rounded-full text-blue-300 text-sm font-medium mb-6 border border-blue-500/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Protección Activa
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
            {t.sharingTitle}
          </h2>
          <p className="text-2xl text-gray-300 italic font-light">
            &ldquo;{t.sharingSubtitle}&rdquo;
          </p>
        </div>
        
        <div className="grid sm:grid-cols-3 gap-8">
          <FeatureCard 
            stat="99.9%"
            statLabel="Tasa de detección"
            title={t.sharingFeature1}
            description={t.sharingFeature1Desc}
            colorClass="blue"
            icon={<SingleSessionIcon />}
          />
          <FeatureCard 
            stat="<1s"
            statLabel="Tiempo de respuesta"
            title={t.sharingFeature2}
            description={t.sharingFeature2Desc}
            colorClass="purple"
            icon={<DetectionIcon />}
          />
          <FeatureCard 
            stat="24/7"
            statLabel="Monitoreo activo"
            title={t.sharingFeature3}
            description={t.sharingFeature3Desc}
            colorClass="pink"
            icon={<AlertIcon />}
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
  colorClass: 'blue' | 'purple' | 'pink';
  icon: React.ReactNode;
}

function FeatureCard({ stat, statLabel, title, description, colorClass, icon }: FeatureCardProps) {
  const colors = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      stat: 'text-blue-400',
      border: 'border-blue-500/50',
      shadow: 'shadow-blue-500/20',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      stat: 'text-purple-400',
      border: 'border-purple-500/50',
      shadow: 'shadow-purple-500/20',
    },
    pink: {
      gradient: 'from-pink-500 to-pink-600',
      stat: 'text-pink-400',
      border: 'border-pink-500/50',
      shadow: 'shadow-pink-500/20',
    }
  };

  const c = colors[colorClass];

  return (
    <div className="group h-full">
      <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 hover:${c.border} transition-all hover:shadow-2xl hover:${c.shadow} h-full flex flex-col`}>
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${c.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div className="text-right">
            <div className={`text-2xl sm:text-3xl font-bold ${c.stat}`}>{stat}</div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">{statLabel}</div>
          </div>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed flex-1">{description}</p>
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
