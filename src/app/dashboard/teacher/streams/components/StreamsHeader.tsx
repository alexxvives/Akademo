import { Class } from '@/hooks/useStreamsData';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';

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
        <ClassSearchDropdown
          classes={classes}
          value={selectedClass}
          onChange={onClassChange}
          allLabel="Todas las asignaturas"
          className="w-full md:w-64"
        />
      )}
    </div>
  );
}
