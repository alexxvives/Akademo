interface ClassesEmptyStateProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
  selectedAcademy: string;
}

export function ClassesEmptyState({ role, selectedAcademy }: ClassesEmptyStateProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <svg
        className="w-16 h-16 mx-auto mb-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay asignaturas registradas</h3>
      <p className="text-gray-600 mb-4">
        {role === 'ADMIN'
          ? selectedAcademy === 'all'
            ? 'No hay clases en la plataforma aún.'
            : 'No hay clases en esta academia.'
          : 'Crea tu primera asignatura y asigna un profesor.'}
      </p>
    </div>
  );
}
