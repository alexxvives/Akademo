'use client';

import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { MigrationModal } from '@/components/admin/MigrationModal';
import { AcademyRow } from './components/AcademyRow';
import { useAcademies } from './components/useAcademies';

export default function AdminAcademies() {
  const {
    academies, loading, deletingId, togglingId, togglingDailyId,
    expandedId, billingByAcademy, migrationAcademy,
    setMigrationAcademy, handleToggleExpand, handleTogglePayment,
    handleToggleDaily, handleDelete, handleBillingAdded, handleBillingDeleted,
  } = useAcademies();

  if (loading) return <SkeletonTable rows={10} cols={7} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Academias</h1>
        <p className="text-sm text-gray-500 mt-1">AKADEMO PLATFORM</p>
      </div>

      {academies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Las academias aparecerán aquí cuando se registren</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiantes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrículas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado de Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {academies.map((academy) => (
                  <AcademyRow
                    key={academy.id}
                    academy={academy}
                    expandedId={expandedId}
                    deletingId={deletingId}
                    togglingId={togglingId}
                    togglingDailyId={togglingDailyId}
                    billingRecords={billingByAcademy[academy.id]}
                    onToggleExpand={handleToggleExpand}
                    onTogglePayment={handleTogglePayment}
                    onToggleDaily={handleToggleDaily}
                    onDelete={handleDelete}
                    onMigration={setMigrationAcademy}
                    onBillingAdded={handleBillingAdded}
                    onBillingDeleted={handleBillingDeleted}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {migrationAcademy && (
        <MigrationModal
          academyId={migrationAcademy.id}
          academyName={migrationAcademy.name}
          onClose={() => setMigrationAcademy(null)}
        />
      )}
    </div>
  );
}
