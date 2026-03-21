interface ClassFullMessageProps {
  maxStudents?: number;
}

export function ClassFullMessage({ maxStudents }: ClassFullMessageProps) {
  return (
    <div className="p-8">
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
        <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Clase completa</h3>
        <p className="text-gray-600 mb-4">
          Esta clase ha alcanzado su límite máximo de {maxStudents} estudiantes.
        </p>
        <p className="text-sm text-gray-500">
          Puedes contactar a la academia para solicitar más cupos.
        </p>
      </div>
    </div>
  );
}
