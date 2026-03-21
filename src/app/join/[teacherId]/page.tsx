'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useJoinPage } from './useJoinPage';
import { JoinAuthForm } from './JoinAuthForm';
import { JoinClassSelection } from './JoinClassSelection';

export default function JoinPage() {
  const router = useRouter();
  const state = useJoinPage();

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{state.error}</p>
        </div>
      </div>
    );
  }

  if (state.requestSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h1>
          <p className="text-gray-600 mb-6">
            Tu solicitud de acceso ha sido enviada. El profesor revisará tu solicitud y te dará acceso pronto.
          </p>
          <button
            onClick={() => router.push('/dashboard/student')}
            className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
          >
            Ir al Dashboard
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
          {state.teacher && (
            <div className="flex flex-col items-center mt-2 gap-2">
              {state.teacher.academyLogoUrl && (
                <Image
                  src={`/api/storage/serve/${state.teacher.academyLogoUrl}`}
                  alt={state.teacher.academyName || state.teacher.firstName}
                  width={64}
                  height={64}
                  unoptimized
                  className="w-16 h-16 rounded-xl object-contain"
                />
              )}
              <p className="text-xl font-semibold text-gray-900">
                {state.teacher.firstName} {state.teacher.lastName}
              </p>
            </div>
          )}
        </div>

        {!state.isLoggedIn ? (
          <JoinAuthForm
            showLogin={state.showLogin}
            setShowLogin={state.setShowLogin}
            showVerification={state.showVerification}
            setShowVerification={state.setShowVerification}
            authError={state.authError}
            formData={state.formData}
            setFormData={state.setFormData}
            authLoading={state.authLoading}
            handleAuth={state.handleAuth}
            verificationCode={state.verificationCode}
            setVerificationCode={state.setVerificationCode}
            verificationError={state.verificationError}
            verificationSuccess={state.verificationSuccess}
            verifyingCode={state.verifyingCode}
            inputRefs={state.inputRefs}
            handleCodeChange={state.handleCodeChange}
            handleCodeKeyDown={state.handleCodeKeyDown}
            handleCodePaste={state.handleCodePaste}
            sendVerificationCode={state.sendVerificationCode}
          />
        ) : (
          <JoinClassSelection
            classes={state.classes}
            selectedClassIds={state.selectedClassIds}
            toggleClass={state.toggleClass}
            authError={state.authError}
            authLoading={state.authLoading}
            handleRequestAccess={state.handleRequestAccess}
          />
        )}
      </div>
    </div>
  );
}
