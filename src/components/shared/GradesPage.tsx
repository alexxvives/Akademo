'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { Bar } from 'react-chartjs-2';
import { generateDemoAssignments, generateDemoSubmissions, generateDemoClasses } from '@/lib/demo-data';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StudentGrade {
  studentId: string;
  studentName: string;
  studentEmail: string;
  assignmentId: string;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  gradedAt: string;
  className: string;
  assignmentUploadIds?: string;
  assignmentUploadId?: string;
  submissionUploadId?: string;
  assignmentStoragePath?: string;
  submissionStoragePath?: string;
}

interface StudentAverage {
  studentId: string;
  studentName: string;
  averageGrade: number;
  totalAssignments: number;
}

interface ClassSummary {
  id: string;
  name: string;
  university?: string | null;
  carrera?: string | null;
}

interface Academy {
  id: string;
  name: string;
}

interface AssignmentSummary {
  id: string;
  title: string;
  maxScore: number;
  className?: string | null;
  attachmentIds?: string;
  uploadId?: string | null;
}

interface AssignmentDetail {
  attachmentStoragePath?: string | null;
  submissions?: AssignmentSubmission[];
}

interface AssignmentSubmission {
  gradedAt?: string | null;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  uploadId?: string | null;
  submissionStoragePath?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface GradesPageProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
}

export function GradesPage({ role }: GradesPageProps) {
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [averages, setAverages] = useState<StudentAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [searchQuery, setSearchQuery] = useState('');
  const [academyName, setAcademyName] = useState<string>('');

  // Admin-only
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>('');

  const isDemo = (role === 'ACADEMY' || role === 'TEACHER') && paymentStatus === 'NOT PAID';

  // --- Data loading ---

  const loadGrades = useCallback(async () => {
    if (!selectedClass || selectedClass === '') {
      console.log('[GradesPage] loadGrades called but no class selected');
      return;
    }
    
    console.log('[GradesPage] loadGrades starting for:', selectedClass, 'isDemo:', isDemo); // DEBUG
    setLoading(true);
    try {
      if (isDemo) {
        const demoAssignments = generateDemoAssignments();
        const filtered =
          selectedClass === 'all' ? demoAssignments : demoAssignments.filter((a) => a.classId === selectedClass);

        console.log('[GradesPage] Demo mode - assignments:', filtered.length); // DEBUG
        const gradesData: StudentGrade[] = [];
        filtered.forEach((assignment) => {
          const submissions = generateDemoSubmissions(assignment.id);
          submissions.forEach((sub) => {
            if (sub.gradedAt && sub.score !== undefined) {
              gradesData.push({
                studentId: sub.studentEmail,
                studentName: sub.studentName,
                studentEmail: sub.studentEmail,
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                score: sub.score,
                maxScore: assignment.maxScore,
                gradedAt: sub.gradedAt,
                className: assignment.className,
                assignmentUploadIds: assignment.attachmentIds,
                assignmentStoragePath: `/demo/Documento.pdf`,
                submissionStoragePath: sub.fileUrl,
              });
            }
          });
        });

        setGrades(gradesData);
        calcAverages(gradesData);
        console.log('[GradesPage] Demo grades loaded:', gradesData.length); // DEBUG
        setLoading(false);
        return;
      }

      // Real data
      let endpoint: string;
      if (role === 'ADMIN') {
        if (selectedAcademy === 'all') {
          endpoint = selectedClass === 'all' ? '/assignments/all' : `/assignments?classId=${selectedClass}`;
        } else {
          endpoint =
            selectedClass === 'all'
              ? `/assignments?academyId=${selectedAcademy}`
              : `/assignments?classId=${selectedClass}`;
        }
      } else {
        // ACADEMY and TEACHER use same endpoint
        endpoint = selectedClass === 'all' ? '/assignments/all' : `/assignments?classId=${selectedClass}`;
      }

      console.log('[GradesPage] Fetching assignments from:', endpoint); // DEBUG
      const assignmentsRaw = await apiClient(endpoint);
      const assignmentsRes = (await assignmentsRaw.json()) as ApiResponse<AssignmentSummary[]>;
      if (!assignmentsRes.success) {
        console.error('[GradesPage] Failed to fetch assignments:', assignmentsRes.error); // DEBUG
        setLoading(false);
        return;
      }

      console.log('[GradesPage] Assignments fetched:', assignmentsRes.data.length); // DEBUG
      const allGrades: StudentGrade[] = [];
      for (const assignment of assignmentsRes.data) {
        const res = await apiClient(`/assignments/${assignment.id}`);
        const detail = (await res.json()) as ApiResponse<AssignmentDetail>;
        if (detail.success && detail.data.submissions) {
          detail.data.submissions.forEach((sub) => {
            if (sub.gradedAt) {
              allGrades.push({
                studentId: sub.studentId,
                studentName: sub.studentName,
                studentEmail: sub.studentEmail,
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                score: sub.score,
                maxScore: assignment.maxScore,
                gradedAt: sub.gradedAt,
                className: assignment.className || '',
                assignmentUploadIds: assignment.attachmentIds,
                assignmentUploadId: assignment.uploadId ?? undefined,
                submissionUploadId: sub.uploadId ?? undefined,
                assignmentStoragePath: detail.data.attachmentStoragePath ?? undefined,
                submissionStoragePath: sub.submissionStoragePath ?? undefined,
              });
            }
          });
        }
      }

      console.log('[GradesPage] Total graded submissions:', allGrades.length); // DEBUG
      setGrades(allGrades);
      calcAverages(allGrades);
      setLoading(false);
    } catch (error) {
      console.error('Error loading grades:', error);
      setLoading(false);
    }
  }, [isDemo, selectedClass, selectedAcademy, role]);

  const calcAverages = (data: StudentGrade[]) => {
    const studentMap = new Map<string, { totalScore: number; totalMax: number; count: number; name: string }>();
    data.forEach((grade) => {
      const existing = studentMap.get(grade.studentId) || {
        totalScore: 0,
        totalMax: 0,
        count: 0,
        name: grade.studentName,
      };
      existing.totalScore += grade.score;
      existing.totalMax += grade.maxScore;
      existing.count++;
      studentMap.set(grade.studentId, existing);
    });
    const arr: StudentAverage[] = Array.from(studentMap.entries()).map(([id, d]) => ({
      studentId: id,
      studentName: d.name,
      averageGrade: (d.totalScore / d.totalMax) * 100,
      totalAssignments: d.count,
    }));
    setAverages(arr.sort((a, b) => b.averageGrade - a.averageGrade));
  };

  // Load initial data (classes, academies)
  const loadInitial = useCallback(async () => {
    try {
      if (role === 'ACADEMY' || role === 'TEACHER') {
        const [academyRes] = await Promise.all([apiClient('/academies')]);
        const academyResult = await academyRes.json();
        if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
          const academy = academyResult.data[0];
          const status = academy.paymentStatus || 'NOT PAID';
          setPaymentStatus(status);
          if (academy.name) setAcademyName(academy.name);

          if (status === 'NOT PAID') {
            const demoClasses = generateDemoClasses();
            setClasses(demoClasses.map((c) => ({ id: c.id, name: c.name })));
            setSelectedClass('all');
            setLoading(false);
            return;
          }
        }
        const res = await apiClient('/classes');
        const response = (await res.json()) as ApiResponse<ClassSummary[]>;
        if (response.success) {
          setClasses(response.data);
          if (response.data.length > 0) setSelectedClass('all');
          else setLoading(false);
        } else {
          setLoading(false);
        }
      } else {
        // ADMIN
        const res = await apiClient('/academies');
        const response: { success: boolean; data: Academy[] } = await res.json();
        if (response.success) {
          setAcademies(response.data);
          if (response.data.length > 0) setSelectedAcademy('all');
          else setLoading(false);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setLoading(false);
    }
  }, [role]);

  // Admin: load classes when academy changes
  const loadClasses = useCallback(async () => {
    if (role !== 'ADMIN' || !selectedAcademy) return;
    try {
      const endpoint = selectedAcademy === 'all' ? '/classes' : `/classes?academyId=${selectedAcademy}`;
      const res = await apiClient(endpoint);
      const response: { success: boolean; data: ClassSummary[] } = await res.json();
      if (response.success) {
        setClasses(response.data);
        if (response.data.length > 0) setSelectedClass('all');
        else {
          setSelectedClass('');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setLoading(false);
    }
  }, [role, selectedAcademy]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (role === 'ADMIN' && selectedAcademy) loadClasses();
  }, [role, selectedAcademy, loadClasses]);

  useEffect(() => {
    // Only load grades when selectedClass is actually set (not empty string)
    // Note: 'all' is a valid value and should trigger loading
    if (selectedClass && selectedClass !== '') {
      console.log('[GradesPage] Loading grades for class:', selectedClass); // DEBUG
      loadGrades();
    }
  }, [selectedClass, loadGrades]);

  // Filtering
  const filteredGrades = useMemo(() => {
    if (!searchQuery.trim()) return grades;
    const q = searchQuery.toLowerCase();
    return grades.filter(
      (g) => g.studentName.toLowerCase().includes(q) || g.studentEmail.toLowerCase().includes(q)
    );
  }, [grades, searchQuery]);

  const filteredAverages = useMemo(() => {
    if (!searchQuery.trim()) return averages;
    const q = searchQuery.toLowerCase();
    return averages.filter((a) => a.studentName.toLowerCase().includes(q));
  }, [averages, searchQuery]);

  const top10Averages = filteredAverages.slice(0, 10);

  // Chart
  const chartData = {
    labels: top10Averages.map((a) => a.studentName),
    datasets: [
      {
        label: 'Promedio (%)',
        data: top10Averages.map((a) => Math.round(a.averageGrade)),
        backgroundColor: top10Averages.map((a) =>
          a.averageGrade === 100
            ? 'rgba(22, 101, 52, 0.8)'
            : a.averageGrade >= 70
              ? 'rgba(5, 150, 105, 0.8)'
              : a.averageGrade >= 50
                ? 'rgba(249, 115, 22, 0.8)'
                : 'rgba(220, 38, 38, 0.8)'
        ),
        borderColor: top10Averages.map((a) =>
          a.averageGrade === 100
            ? 'rgb(22, 101, 52)'
            : a.averageGrade >= 70
              ? 'rgb(5, 150, 105)'
              : a.averageGrade >= 50
                ? 'rgb(249, 115, 22)'
                : 'rgb(220, 38, 38)'
        ),
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number }) => {
            const avg = top10Averages[context.dataIndex];
            return `Promedio: ${avg.averageGrade.toFixed(1)}% (${avg.totalAssignments} ejercicios)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (value: number | string) => `${value}%` },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      x: { grid: { display: false } },
    },
  };

  const handleDownload = (storagePath: string) => {
    if (storagePath.startsWith('/demo/') || storagePath.startsWith('demo/')) {
      window.open(storagePath.startsWith('/') ? storagePath : `/${storagePath}`, '_blank');
    } else {
      window.open(`/api/documents/${storagePath}`, '_blank');
    }
  };

  const handleRemoveAssignmentFiles = async (assignmentId: string) => {
    if (!confirm('¿Eliminar todos los archivos de este ejercicio?')) return;
    try {
      const res = await apiClient(`/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachmentIds: '' }),
      });
      const result = await res.json();
      if (result.success) {
        setGrades(prev => prev.map(g => g.assignmentId === assignmentId ? { ...g, assignmentUploadIds: undefined, assignmentUploadId: undefined, assignmentStoragePath: undefined } : g));
      }
    } catch (error) {
      console.error('Failed to remove exercise files:', error);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-full md:w-64"></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="h-5 bg-gray-200 rounded w-40"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (((role === 'ACADEMY' || role === 'TEACHER') && classes.length === 0) || (role === 'ADMIN' && academies.length === 0)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calificaciones</h1>
          <p className="text-sm text-gray-500 mt-1">{role === 'ADMIN' ? 'AKADEMO PLATFORM' : academyName || ''}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-12 text-center">
          <div className="text-gray-900 font-medium mb-2">
            {role === 'ADMIN' ? 'No hay academias disponibles' : 'No hay asignaturas disponibles'}
          </div>
          <p className="text-gray-500">
            {role === 'ADMIN'
              ? 'No hay academias registradas en la plataforma.'
              : 'Necesitas crear asignaturas para ver calificaciones.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calificaciones</h1>
          <p className="text-sm text-gray-500 mt-1">{role === 'ADMIN' ? 'AKADEMO PLATFORM' : academyName || ''}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Admin: academy filter */}
          {role === 'ADMIN' && (
            <AcademySearchDropdown
              academies={academies}
              value={selectedAcademy}
              onChange={setSelectedAcademy}
              allLabel="Todas las academias"
              className="w-full sm:w-56"
            />
          )}

          {/* Class filter */}
          <ClassSearchDropdown
            classes={classes}
            value={selectedClass}
            onChange={setSelectedClass}
            allLabel="Todas las asignaturas"
            className="w-full sm:w-56"
            disabled={classes.length === 0}
          />
        </div>
      </div>

      {filteredAverages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-12 text-center">
          <p className="text-gray-500">
            {selectedClass === 'all' 
              ? 'No hay calificaciones para mostrar. Asegúrate de haber calificado algunas entregas de ejercicios.'
              : 'No hay calificaciones para mostrar en esta asignatura'}
          </p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Promedios por Estudiante</h2>
              <p className="text-sm text-gray-500">Solo muestra los top 10 estudiantes</p>
            </div>
            <div className="h-80">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{filteredAverages.length}</span> estudiante
                {filteredAverages.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ejercicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ejercicios
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrega
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calificación
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGrades.map((grade, idx) => (
                    <tr key={`${grade.studentId}-${grade.assignmentTitle}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {grade.studentName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{grade.assignmentTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          let fileCount = 0;
                          if (grade.assignmentUploadIds) {
                            fileCount = grade.assignmentUploadIds.split(',').filter((id) => id.trim()).length;
                          } else if (grade.assignmentUploadId) {
                            fileCount = 1;
                          }
                          return fileCount > 0 && grade.assignmentStoragePath ? (
                            <button
                              onClick={() => handleDownload(grade.assignmentStoragePath!)}
                              className="flex items-center gap-2 text-sm text-gray-900 hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors group"
                            >
                              <div className="relative">
                                <div className="w-8 h-10 flex items-center justify-center bg-red-50 rounded border border-red-200">
                                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                {(role === 'ACADEMY' || role === 'TEACHER') && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveAssignmentFiles(grade.assignmentId); }}
                                    className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                                    title="Eliminar archivos">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              <span className="text-xs">
                                {fileCount} archivo{fileCount > 1 ? 's' : ''}
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Sin archivo</span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {grade.submissionStoragePath ? (
                          <button
                            onClick={() => handleDownload(grade.submissionStoragePath!)}
                            className="flex items-center gap-2 text-sm text-gray-900 hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors"
                          >
                            <div className="w-8 h-10 flex items-center justify-center bg-green-50 rounded border border-green-200">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <span className="text-xs">1 archivo</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Sin entregar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(grade.gradedAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`text-sm font-medium ${
                            grade.score === grade.maxScore
                              ? 'text-green-800'
                              : grade.score / grade.maxScore >= 0.7
                                ? 'text-green-600'
                                : grade.score / grade.maxScore >= 0.5
                                  ? 'text-orange-500'
                                  : 'text-red-600'
                          }`}
                        >
                          {grade.score} / {grade.maxScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
