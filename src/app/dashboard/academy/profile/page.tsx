'use client';

import { SkeletonProfile } from '@/components/ui/SkeletonLoader';
import { useProfileData } from '@/components/profile/useProfileData';
import { useProfileActions } from '@/components/profile/useProfileActions';
import { useProfileConnections } from '@/components/profile/useProfileConnections';
import { AcademyInfoCard } from '@/components/profile/AcademyInfoCard';
import { AdvancedSettingsCard, SidebarMenuCard, PasswordCard } from '@/components/profile/ProfileSettingsCards';
import { PaymentMethodsCard } from '@/components/profile/PaymentMethodsCard';
import { StreamingAccountsCard } from '@/components/profile/StreamingAccountsCard';
import { StripeConnectCard } from '@/components/profile/StripeConnectCard';
import { AcademicPeriodsSection } from '@/components/profile/AcademicPeriodsSection';

export default function ProfilePage() {
  const s = useProfileData();
  const actions = useProfileActions(s);
  const conn = useProfileConnections(s);

  if (s.loading) return <SkeletonProfile />;

  return (
    <div className="space-y-6 pb-12">
      {s.connectingStripe && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
            <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Conectando con Stripe</p>
              <p className="text-sm text-gray-500 mt-1">Preparando tu sesión de verificación...</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-600 mt-1">Administra la información y preferencias de tu academia</p>
        </div>
      </div>

      {s.academy && <AcademyInfoCard s={s} actions={actions} />}
      <AdvancedSettingsCard s={s} actions={actions} />
      <SidebarMenuCard s={s} actions={actions} />
      <PaymentMethodsCard s={s} actions={actions} />
      <StreamingAccountsCard s={s} conn={conn} />
      <StripeConnectCard s={s} conn={conn} />
      <AcademicPeriodsSection s={s} conn={conn} />
      <PasswordCard s={s} actions={actions} />
    </div>
  );
}
