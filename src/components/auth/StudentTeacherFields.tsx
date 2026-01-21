interface Academy {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  teacherName?: string;
}

interface StudentTeacherFieldsProps {
  role: 'STUDENT' | 'TEACHER';
  firstName: string;
  lastName: string;
  academyId: string;
  classId: string;
  classIds: string[];
  academies: Academy[];
  classes: Class[];
  loadingAcademies: boolean;
  loadingClasses: boolean;
  onFirstNameChange: (name: string) => void;
  onLastNameChange: (name: string) => void;
  onAcademyChange: (id: string) => void;
  onClassChange: (id: string) => void;
  onClassIdsChange: (ids: string[]) => void;
}

export function StudentTeacherFields({ 
  role, firstName, lastName, academyId, classId, classIds,
  academies, classes, loadingAcademies, loadingClasses,
  onFirstNameChange, onLastNameChange, onAcademyChange, onClassChange, onClassIdsChange
}: StudentTeacherFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
            placeholder="Juan"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
            placeholder="Pérez"
          />
        </div>
      </div>

      {/* Academy Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Academia {academies.length > 0 && <span className="text-gray-500">({academies.length} disponibles)</span>}
        </label>
        <div className="relative">
          <select
            required
            value={academyId}
            onChange={(e) => onAcademyChange(e.target.value)}
            className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all appearance-none bg-white"
            disabled={loadingAcademies}
          >
            <option value="">Selecciona una academia</option>
            {academies.map(academy => (
              <option key={academy.id} value={academy.id}>{academy.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {loadingAcademies && <p className="text-xs text-gray-500 mt-1">Cargando academias...</p>}
        {!loadingAcademies && academies.length === 0 && (
          <p className="text-xs text-red-500 mt-1">No hay academias disponibles. Por favor contacta al administrador.</p>
        )}
      </div>

      {/* Student: Single Class Selection */}
      {role === 'STUDENT' && academyId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Clase {classes.length > 0 && <span className="text-gray-500">({classes.length} disponibles)</span>}
          </label>
          <div className="relative">
            <select
              required
              value={classId}
              onChange={(e) => onClassChange(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all appearance-none bg-white"
              disabled={loadingClasses}
            >
              <option value="">Selecciona una clase</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.teacherName ? `(${cls.teacherName})` : ''}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {loadingClasses && <p className="text-xs text-gray-500 mt-1">Cargando clases...</p>}
          <p className="text-xs text-gray-500 mt-1">Necesitarás aprobación del profesor</p>
        </div>
      )}

      {/* Teacher: Multi-select Classes */}
      {role === 'TEACHER' && academyId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Clases a enseñar</label>
          <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
            {loadingClasses ? (
              <p className="text-xs text-gray-500">Cargando clases...</p>
            ) : classes.length === 0 ? (
              <p className="text-xs text-gray-500">No hay clases disponibles</p>
            ) : (
              classes.map(cls => (
                <label key={cls.id} className="flex items-center gap-2 py-1.5 hover:bg-gray-50 rounded px-2">
                  <input
                    type="checkbox"
                    checked={classIds.includes(cls.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onClassIdsChange([...classIds, cls.id]);
                      } else {
                        onClassIdsChange(classIds.filter(id => id !== cls.id));
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{cls.name}</span>
                </label>
              ))
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Selecciona al menos una. Necesitarás aprobación de la academia.</p>
        </div>
      )}
    </>
  );
}
