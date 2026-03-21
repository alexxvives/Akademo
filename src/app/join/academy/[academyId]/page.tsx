'use client';

import Image from 'next/image';
import { SkeletonForm } from '@/components/ui/SkeletonLoader';
import { useAcademyJoin } from './useAcademyJoin';
import { AuthForm } from './components/AuthForm';
import { ClassSelection } from './components/ClassSelection';

export default function AcademyJoinPage() {
  const {
    academy, loading, error, isLoggedIn, router,
    authFormProps, classSelectionProps,
  } = useAcademyJoin();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SkeletonForm />
      </div>
    );
  }

  if (error || !academy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Academia no encontrada'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <p className="text-gray-600">Únete a las clases de</p>
          {academy && (
            <div className="flex flex-col items-center mt-2 gap-2">
              {academy.logoUrl && (
                <Image
                  src={`/api/storage/serve/${academy.logoUrl}`}
                  alt={academy.name}
                  width={64}
                  height={64}
                  unoptimized
                  className="w-16 h-16 rounded-xl object-contain"
                />
              )}
              <p className="text-xl font-semibold text-gray-900">
                {academy.name}
              </p>
            </div>
          )}
        </div>

        {!isLoggedIn ? (
          <AuthForm {...authFormProps} />
        ) : (
          <ClassSelection {...classSelectionProps} />
        )}
      </div>
    </div>
  );
}
