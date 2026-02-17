import { Class } from '@/hooks/useTeacherDashboard';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';

interface TeacherDashboardHeaderProps {
  academyName: string;
  hasAcademy: boolean;
  classes: Class[];
  selectedClass: string;
  onClassChange: (classId: string) => void;
}

export function TeacherDashboardHeader({ academyName, hasAcademy, classes, selectedClass, onClassChange }: TeacherDashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
        {hasAcademy && academyName && (
          <p className="text-sm text-gray-500 mt-1">{academyName}</p>
        )}
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
