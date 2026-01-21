interface AcademyFieldsProps {
  academyName: string;
  monoacademy: boolean;
  onAcademyNameChange: (name: string) => void;
  onMonoacademyChange: (value: boolean) => void;
}

export function AcademyFields({ academyName, monoacademy, onAcademyNameChange, onMonoacademyChange }: AcademyFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la Academia</label>
        <input
          type="text"
          required
          value={academyName}
          onChange={(e) => onAcademyNameChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
          placeholder="Academia de Matemáticas"
        />
      </div>
      
      {/* MonoAcademy Toggle */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="flex-1">
          <label htmlFor="monoacademy-toggle" className="text-sm text-gray-700 cursor-pointer">
            Soy el único profesor de la academia
          </label>
          <p className="text-xs text-gray-500 mt-0.5">Podrás cambiar entre ambas cuentas fácilmente</p>
        </div>
        <button
          type="button"
          id="monoacademy-toggle"
          role="switch"
          aria-checked={monoacademy}
          onClick={() => onMonoacademyChange(!monoacademy)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            monoacademy ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              monoacademy ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </>
  );
}
