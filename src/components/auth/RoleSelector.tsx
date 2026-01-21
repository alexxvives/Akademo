interface RoleSelectorProps {
  role: string;
  onChange: (role: string) => void;
}

export function RoleSelector({ role, onChange }: RoleSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de cuenta</label>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onChange('STUDENT')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            role === 'STUDENT'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Estudiante
        </button>
        <button
          type="button"
          onClick={() => onChange('TEACHER')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            role === 'TEACHER'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Profesor
        </button>
        <button
          type="button"
          onClick={() => onChange('ACADEMY')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            role === 'ACADEMY'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Academia
        </button>
      </div>
      {role === 'ACADEMY' && (
        <p className="text-xs text-gray-500 mt-2">Tu academia necesitará aprobación del administrador</p>
      )}
    </div>
  );
}
