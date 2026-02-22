interface ManagementSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

export function ManagementSection({ t }: ManagementSectionProps) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full text-emerald-600 text-xs font-semibold uppercase tracking-wide mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Sistema de Gestión
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {t.managementTitle}
          </h2>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            {t.managementSubtitle}
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-8">
          <ManagementCard 
            icon={<TeacherIcon />}
            title={t.managementFeature1}
            description={t.managementFeature1Desc}
            features={['Autonomía total', 'Control individual']}
          />
          <ManagementCard 
            icon={<StudentIcon />}
            title={t.managementFeature2}
            description={t.managementFeature2Desc}
            features={['Inscripciones simples', 'Seguimiento completo']}
          />
          <ManagementCard 
            icon={<ClassIcon />}
            title={t.managementFeature3}
            description={t.managementFeature3Desc}
            features={['Estructura flexible', 'Fácil organización']}
          />
          <ManagementCard 
            icon={<RolesIcon />}
            title={t.managementFeature4}
            description={t.managementFeature4Desc}
            features={['Permisos claros', 'Accesos definidos']}
          />
        </div>
      </div>
    </section>
  );
}

interface ManagementCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

function ManagementCard({ icon, title, description, features }: ManagementCardProps) {
  return (
    <div className="group relative">
      <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-emerald-200 hover:shadow-lg transition-all">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4">
          {features.map((feature, index) => (
            <div key={index} className={`flex items-center justify-between text-sm ${index > 0 ? 'mt-2' : ''}`}>
              <span className="text-gray-600">{feature}</span>
              <span className="text-emerald-600 font-semibold">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeacherIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function StudentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ClassIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function RolesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
