import { Class } from '@/hooks/useStreamsData';

interface StreamsHeaderProps {
  academyName: string;
  classes: Class[];
  selectedClass: string;
  onClassChange: (classId: string) => void;
}

export function StreamsHeader({ academyName, classes, selectedClass, onClassChange }: StreamsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Historial de Streams</h1>
        {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
      </div>
      
      {classes.length > 0 && (
        <div className='relative'>
          <select
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
            className='appearance-none w-full md:w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
          >
            <option value='all'>Todas las clases</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
