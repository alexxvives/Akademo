interface WatermarkSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

export function WatermarkSection({ t }: WatermarkSectionProps) {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
            {t.watermarkTitle}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t.watermarkSubtitle}
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <VideoWatermarkDemo />
          <WatermarkFeatureList t={t} />
        </div>
        
        <QuoteCard quote={t.watermarkQuote} />
      </div>
    </section>
  );
}

function VideoWatermarkDemo() {
  return (
    <div className="order-2 lg:order-1">
      <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
          {/* Simulated video player */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              </div>
              <p className="text-white/60 text-sm">Video de Clase</p>
            </div>
          </div>
          
          {/* Dynamic watermarks */}
          <div className="absolute top-6 left-6 bg-black/40 backdrop-blur px-3 py-1.5 rounded text-white/70 text-sm font-mono border border-white/10">
            Juan Pérez
          </div>
          <div className="absolute top-6 right-6 bg-black/40 backdrop-blur px-3 py-1.5 rounded text-white/70 text-sm font-mono border border-white/10">
            juan.perez@email.com
          </div>
          <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur px-3 py-1.5 rounded text-white/70 text-xs font-mono border border-white/10">
            ID: #STU-45892
          </div>
          <div className="absolute bottom-6 right-6 bg-black/40 backdrop-blur px-3 py-1.5 rounded text-white/70 text-xs font-mono border border-white/10">
            {new Date().toLocaleTimeString()}
          </div>
          
          {/* Center subtle watermark */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/10 text-6xl font-bold transform -rotate-12">
              JUAN PÉREZ
            </div>
          </div>
        </div>
        <div className="p-4 bg-black/30 backdrop-blur border-t border-white/5 flex items-center justify-between">
          <span className="text-white/60 text-sm">Siempre visible • No removible</span>
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Activo
          </div>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WatermarkFeatureList({ t }: { t: Record<string, any> }) {
  return (
    <div className="order-1 lg:order-2 space-y-8">
      <WatermarkFeature 
        icon={<WatermarkIcon />}
        title={t.watermarkFeature1}
        description={t.watermarkFeature1Desc}
        colorClass="blue"
      />
      <WatermarkFeature 
        icon={<TraceIcon />}
        title={t.watermarkFeature2}
        description={t.watermarkFeature2Desc}
        colorClass="purple"
      />
      <WatermarkFeature 
        icon={<ShieldIcon />}
        title={t.watermarkFeature3}
        description={t.watermarkFeature3Desc}
        colorClass="green"
      />
    </div>
  );
}

function WatermarkFeature({ icon, title, description, colorClass }: { icon: React.ReactNode; title: string; description: string; colorClass: 'blue' | 'purple' | 'green' }) {
  const colors = {
    blue: 'bg-blue-500/20 border-blue-500/30',
    purple: 'bg-purple-500/20 border-purple-500/30',
    green: 'bg-green-500/20 border-green-500/30'
  };

  return (
    <div className="flex gap-4">
      <div className={`flex-shrink-0 w-12 h-12 ${colors[colorClass]} rounded-xl flex items-center justify-center border`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-white text-xl mb-2">{title}</h3>
        <p className="text-blue-200">{description}</p>
      </div>
    </div>
  );
}

function QuoteCard({ quote }: { quote: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-2xl opacity-20" />
      <div className="relative bg-blue-500/10 backdrop-blur-xl rounded-2xl p-8 sm:p-12 text-center border border-blue-500/30">
        <p className="text-2xl sm:text-3xl font-bold text-blue-100 leading-relaxed">
          {quote}
        </p>
      </div>
    </div>
  );
}

function WatermarkIcon() {
  return (
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function TraceIcon() {
  return (
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
