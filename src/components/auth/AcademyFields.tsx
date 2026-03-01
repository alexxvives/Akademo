interface AcademyFieldsProps {
  academyName: string;
  onAcademyNameChange: (name: string) => void;
}

export function AcademyFields({ academyName, onAcademyNameChange }: AcademyFieldsProps) {
  return (
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
  );
}
