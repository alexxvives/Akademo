import { Academy, Membership } from '@/hooks/useTeacherDashboard';

interface BrowseAcademiesProps {
  academies: Academy[];
  memberships: Membership[];
  onBack: () => void;
  onRequest: (academyId: string) => void;
}

export function BrowseAcademies({ academies, memberships, onBack, onRequest }: BrowseAcademiesProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Academies</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back
        </button>
      </div>

      <div className="grid gap-4">
        {academies.map((academy) => {
          const alreadyRequested = memberships.some(m => m.academyName === academy.name);
          return (
            <div key={academy.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{academy.name}</h3>
                  {academy.description && (
                    <p className="text-gray-600 text-sm">{academy.description}</p>
                  )}
                </div>
                {!alreadyRequested ? (
                  <button
                    onClick={() => onRequest(academy.id)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
                  >
                    Request to Join
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                    {memberships.find(m => m.academyName === academy.name)?.status === 'APPROVED' ? 'Member' : 'Pending'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
