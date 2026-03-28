'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { SkeletonClasses } from '@/components/ui/SkeletonLoader';

interface AcademyClass {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  academyId: string;
  academyName: string;
  teacherName: string;
  teacherFirstName?: string;
  teacherLastName?: string;
  teacherId: string;
  teacherEmail: string;
  studentCount: number;
  enrollmentStatus: string | null;
  whatsappGroupLink?: string | null;
  university?: string | null;
  carrera?: string | null;
}

const SEP = '|||';

function FilterDropdown({
  groups,
  value,
  onChange,
}: {
  groups: Record<string, string[]>;
  value: string;
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayLabel = useMemo(() => {
    if (!value) return null;
    return value.split(SEP)[1];
  }, [value]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    const result: Record<string, string[]> = {};
    for (const [uni, carreras] of Object.entries(groups)) {
      const matchedCarreras = carreras.filter(
        car => car.toLowerCase().includes(q) || uni.toLowerCase().includes(q)
      );
      if (matchedCarreras.length > 0) result[uni] = matchedCarreras;
    }
    return result;
  }, [groups, search]);

  const handleSelect = (key: string) => {
    onChange(key);
    setIsOpen(false);
    setSearch('');
  };

  const hasResults = Object.values(filteredGroups).some(c => c.length > 0);

  return (
    <div ref={containerRef} className="relative w-full sm:w-72">
      <div
        className={`flex items-center w-full bg-white border rounded-lg text-sm cursor-pointer ${
          isOpen ? 'ring-2 ring-gray-300 border-transparent' : 'border-gray-200'
        }`}
        onClick={() => {
          setIsOpen(true);
          setSearch('');
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar carrera o universidad..."
            className="w-full pl-3 pr-8 py-2 bg-transparent text-sm text-gray-700 outline-none rounded-lg"
            onKeyDown={e => {
              if (e.key === 'Escape') { setIsOpen(false); setSearch(''); }
            }}
          />
        ) : (
          <span className={`block w-full pl-3 pr-8 py-2 truncate ${displayLabel ? 'text-gray-700' : 'text-gray-400'}`}>
            {displayLabel ?? 'Filtrar por carrera'}
          </span>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[20rem] overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
              !value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500'
            }`}
          >
            Todas las carreras
          </button>
          {Object.entries(filteredGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([uni, carreras]) => (
              <div key={uni}>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wide border-t border-gray-100">
                  {uni}
                </div>
                {[...carreras].sort((a, b) => a.localeCompare(b)).map(car => (
                  <button
                    key={`${uni}${SEP}${car}`}
                    type="button"
                    onClick={() => handleSelect(`${uni}${SEP}${car}`)}
                    className={`w-full text-left px-3 py-1.5 pl-6 text-sm hover:bg-gray-50 ${
                      value === `${uni}${SEP}${car}` ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {car}
                  </button>
                ))}
              </div>
            ))}
          {!hasResults && (
            <div className="px-3 py-3 text-sm text-gray-400 text-center">
              No se encontraron resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EnrolledAcademiesClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [filterKey, setFilterKey] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await apiClient('/explore/enrolled-academies/classes');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClass = async (classId: string) => {
    setRequesting(classId);
    try {
      const response = await apiClient('/requests/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });
      const result = await response.json();
      if (result.success) {
        router.push('/dashboard/student/subjects');
      } else {
        alert(result.error || 'Failed to send request');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setRequesting(null);
    }
  };

  // Build grouped options for the filter dropdown
  const filterGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const cls of classes) {
      if (!cls.university && !cls.carrera) continue;
      const uni = cls.university ?? 'Universidad no asignada';
      const car = cls.carrera ?? 'Carrera no asignada';
      if (!groups[uni]) groups[uni] = [];
      if (!groups[uni].includes(car)) groups[uni].push(car);
    }
    return groups;
  }, [classes]);

  const hasFilter = Object.keys(filterGroups).length > 0;

  const filtered = useMemo(() => {
    if (!filterKey) return classes;
    const [uni, car] = filterKey.split(SEP);
    return classes.filter(
      c =>
        (c.university ?? 'Universidad no asignada') === uni &&
        (c.carrera ?? 'Carrera no asignada') === car
    );
  }, [classes, filterKey]);

  if (loading) return <SkeletonClasses />;

  const academyLabel =
    classes.length > 0
      ? `${classes[0].academyName}${classes.some(c => c.academyName !== classes[0].academyName) ? ' y mas' : ''}`
      : 'Clases disponibles en las academias donde ya estas inscrito';

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Unirse a Mas Clases</h1>
          <p className="text-gray-600 text-sm mt-1">{academyLabel}</p>
        </div>
        {hasFilter && (
          <FilterDropdown groups={filterGroups} value={filterKey} onChange={setFilterKey} />
        )}
      </div>

      {/* Content */}
      {classes.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No hay mas clases disponibles</h2>
          <p className="text-gray-600">Ya estas inscrito en todas las clases disponibles de tu academia</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-500 text-sm">No hay clases en esta carrera</p>
          <button onClick={() => setFilterKey('')} className="mt-2 text-sm text-gray-400 underline hover:text-gray-600">
            Ver todas
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...filtered].sort((a, b) => a.name.localeCompare(b.name)).map(classItem => (
            <ClassRow key={classItem.id} classItem={classItem} requesting={requesting} onRequest={handleRequestClass} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClassRow({
  classItem,
  requesting,
  onRequest,
}: {
  classItem: AcademyClass;
  requesting: string | null;
  onRequest: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{classItem.name}</h3>
            {classItem.whatsappGroupLink && (
              <a
                href={classItem.whatsappGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title="Grupo WhatsApp"
              >
                <svg className="w-5 h-5 text-green-500 hover:text-green-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            )}
          </div>
          {classItem.description ? (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{classItem.description}</p>
          ) : (
            <p className="text-sm text-gray-400 italic mb-3">Sin descripcion</p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">Profesor:</span>
            <span>{classItem.teacherName || 'Sin asignar'}</span>
          </div>
        </div>
        <div className="flex-shrink-0 mt-2 sm:mt-0">
          {classItem.enrollmentStatus === 'APPROVED' ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm border border-green-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Ya inscrito
            </span>
          ) : classItem.enrollmentStatus === 'PENDING' ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium text-sm border border-yellow-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Solicitud pendiente
            </span>
          ) : (
            <button
              onClick={() => onRequest(classItem.id)}
              disabled={requesting === classItem.id}
              className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requesting === classItem.id ? 'Solicitando...' : 'Unirse a la Clase'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
