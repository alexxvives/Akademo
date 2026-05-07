import type { JoinClass } from './types';

interface JoinClassSelectionProps {
  classes: JoinClass[];
  selectedClassIds: string[];
  toggleClass: (id: string) => void;
  authError: string | null;
  authLoading: boolean;
  handleRequestAccess: () => void;
}

export function JoinClassSelection({
  classes, selectedClassIds, toggleClass, authError, authLoading, handleRequestAccess,
}: JoinClassSelectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Selecciona tus clases</h2>

      {authError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
          {authError}
        </div>
      )}

      <div className="space-y-3 mb-5 max-h-[50dvh] overflow-y-auto pr-1">
        {classes.map((cls) => (
          <div
            key={cls.id}
            onClick={() => toggleClass(cls.id)}
            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedClassIds.includes(cls.id)
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                {cls.description && (
                  <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">{cls.academyName}</p>
              </div>
              <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                selectedClassIds.includes(cls.id) ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
              }`}>
                {selectedClassIds.includes(cls.id) && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}

        {classes.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Este profesor no tiene clases disponibles actualmente.
          </p>
        )}
      </div>

      <button
        onClick={handleRequestAccess}
        disabled={selectedClassIds.length === 0 || authLoading}
        className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {authLoading ? 'Enviando...' : 'Solicitar Acceso'}
      </button>
    </div>
  );
}
