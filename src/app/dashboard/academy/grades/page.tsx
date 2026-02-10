'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Bar } from 'react-chartjs-2';
import { generateDemoAssignments, generateDemoSubmissions, generateDemoClasses } from '@/lib/demo-data';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StudentGrade {
  studentId: string;
  studentName: string;
  studentEmail: string;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  gradedAt: string;
  className: string;
  assignmentUploadIds?: string; // Comma-separated assignment file upload IDs
  assignmentUploadId?: string; // Legacy single assignment file
  submissionUploadId?: string; // Student submission file ID
  assignmentStoragePath?: string; // Assignment storage path
  submissionStoragePath?: string; // Student submission storage path
}

interface StudentAverage {
  studentId: string;
  studentName: string;
  averageGrade: number;
  totalAssignments: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ClassSummary {
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

export default function AcademyGrades() {
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [averages, setAverages] = useState<StudentAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');

  const loadGrades = useCallback(async () => {
    setLoading(true);
    try {
      // Show demo grades if NOT PAID
      if (paymentStatus === 'NOT PAID') {
        const demoAssignments = generateDemoAssignments();
        const filtered = selectedClass === 'all' 
          ? demoAssignments 
          : demoAssignments.filter(a => a.classId === selectedClass);

        // Build grades data from submissions for each assignment
        const gradesData: StudentGrade[] = [];
        filtered.forEach(assignment => {
          const submissions = generateDemoSubmissions(assignment.id);
          submissions.forEach(sub => {
            if (sub.gradedAt && sub.score !== undefined) {
              gradesData.push({
                studentId: sub.studentEmail, // Use email as ID so same student across assignments is aggregated
                studentName: sub.studentName,
                studentEmail: sub.studentEmail,
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

        // Calculate averages
        const studentMap = new Map<string, {totalScore: number; totalMax: number; count: number; name: string}>();
        gradesData.forEach(grade => {
          const existing = studentMap.get(grade.studentId) || {totalScore: 0, totalMax: 0, count: 0, name: grade.studentName};
          existing.totalScore += grade.score;
          existing.totalMax += grade.maxScore;
          existing.count++;
          studentMap.set(grade.studentId, existing);
        });
        
        const avgArray: StudentAverage[] = Array.from(studentMap.entries()).map(([id, data]) => ({
          studentId: id,
          studentName: data.name,
          averageGrade: (data.totalScore / data.totalMax) * 100,
          totalAssignments: data.count
        }));
        
        setAverages(avgArray.sort((a, b) => b.averageGrade - a.averageGrade));
        setLoading(false);
        return;
      }
      
      // If PAID, load real grades
      const endpoint = selectedClass === 'all' ? '/assignments/all' : `/assignments?classId=${selectedClass}`;
      const assignmentsRaw = await apiClient(endpoint);
      const assignmentsRes = await assignmentsRaw.json() as ApiResponse<AssignmentSummary[]>;
      
      if (!assignmentsRes.success) {
        setLoading(false);
        return;
      }

      // Get submissions for each assignment
      const allGrades: StudentGrade[] = [];
      for (const assignment of assignmentsRes.data) {
        const assignmentRaw = await apiClient(`/assignments/${assignment.id}`);
        const assignmentRes = await assignmentRaw.json() as ApiResponse<AssignmentDetail>;
        if (assignmentRes.success && assignmentRes.data.submissions) {
          assignmentRes.data.submissions.forEach((sub) => {
            if (sub.gradedAt) {
              allGrades.push({
                studentId: sub.studentId,
                studentName: sub.studentName,
                studentEmail: sub.studentEmail,
                assignmentTitle: assignment.title,
                score: sub.score,
                maxScore: assignment.maxScore,
                gradedAt: sub.gradedAt,
                className: assignment.className || '',
                assignmentUploadIds: assignment.attachmentIds,
                assignmentUploadId: assignment.uploadId ?? undefined,
                submissionUploadId: sub.uploadId ?? undefined,
                assignmentStoragePath: assignmentRes.data.attachmentStoragePath ?? undefined,
                submissionStoragePath: sub.submissionStoragePath ?? undefined
              });
            }
          });
        }
      }

      setGrades(allGrades);

      // Calculate averages
      const studentMap = new Map<string, {totalScore: number; totalMax: number; count: number; name: string}>();
      allGrades.forEach(grade => {
        const existing = studentMap.get(grade.studentId) || {totalScore: 0, totalMax: 0, count: 0, name: grade.studentName};
        existing.totalScore += grade.score;
        existing.totalMax += grade.maxScore;
        existing.count++;
        studentMap.set(grade.studentId, existing);
      });

      const avgArray: StudentAverage[] = Array.from(studentMap.entries()).map(([id, data]) => ({
        studentId: id,
        studentName: data.name,
        averageGrade: (data.totalScore / data.totalMax) * 100,
        totalAssignments: data.count
      }));

      setAverages(avgArray.sort((a, b) => b.averageGrade - a.averageGrade));
      setLoading(false);
    } catch (error) {
      console.error('Error loading grades:', error);
      setLoading(false);
    }
  }, [paymentStatus, selectedClass]);

  const loadClasses = useCallback(async () => {
    try {
      // Check payment status and user email
      const [academyRes, userRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/auth/me')
      ]);
      
      const academyResult = await academyRes.json();
      const _userResult = await userRes.json();
      
      if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
        const academy = academyResult.data[0];
        const status = academy.paymentStatus || 'NOT PAID';
        setPaymentStatus(status);
        
        // Show demo data if NOT PAID
        if (status === 'NOT PAID') {
          const demoClasses = generateDemoClasses();
          setClasses(demoClasses.map(c => ({ id: c.id, name: c.name })));
          setSelectedClass('all');
          setLoading(false);
          return;
        }
      }
      
      // If PAID or real unpaid academy, load real classes
      const res = await apiClient('/classes');
      const response = await res.json() as ApiResponse<ClassSummary[]>;
      if (response.success) {
        setClasses(response.data);
        if (response.data.length > 0) {
          setSelectedClass('all');
        } else {
          console.warn('[Grades] No classes found');
          setLoading(false);
        }
      } else {
        console.error('[Grades] API error:', response.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('[Grades] Error loading classes:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (selectedClass) {
      loadGrades();
    }
  }, [selectedClass, loadGrades]);

  const top10Averages = averages.slice(0, 10);

  const chartData = {
    labels: top10Averages.map(a => a.studentName),
    datasets: [{
      label: 'Promedio',
      data: top10Averages.map(a => Math.round(a.averageGrade)),
      backgroundColor: top10Averages.map(a => (
        a.averageGrade === 100 ? 'rgba(22, 101, 52, 0.8)' :
        a.averageGrade >= 70 ? 'rgba(5, 150, 105, 0.8)' :
        a.averageGrade >= 50 ? 'rgba(249, 115, 22, 0.8)' :
        'rgba(220, 38, 38, 0.8)'
      )),
      borderColor: top10Averages.map(a => (
        a.averageGrade === 100 ? 'rgb(22, 101, 52)' :
        a.averageGrade >= 70 ? 'rgb(5, 150, 105)' :
        a.averageGrade >= 50 ? 'rgb(249, 115, 22)' :
        'rgb(220, 38, 38)'
      )),
      borderWidth: 2,
      borderRadius: 6,
    }]
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
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: number | string) => `${value}%`
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-full md:w-64"></div>
        </div>

        {/* Chart Card Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-7 bg-gray-200 rounded w-56"></div>
            <div className="h-5 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>

        {/* Table Card Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="h-5 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></th>
                  <th className="px-6 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></th>
                  <th className="px-6 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></th>
                  <th className="px-6 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></th>
                  <th className="px-6 py-3"><div className="h-4 bg-gray-200 rounded w-12"></div></th>
                  <th className="px-6 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-6 bg-gray-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Calificaciones</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-12 text-center">
          <div className="text-gray-900 font-medium mb-2">No hay asignaturas disponibles</div>
          <p className="text-gray-500">Necesitas crear asignaturas para ver calificaciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Calificaciones</h1>
        <div className="relative w-full md:w-auto">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="appearance-none w-full md:w-64 pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="all">Todas las asignaturas</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {averages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-12 text-center">
            <p className="text-gray-500">No hay calificaciones para mostrar en esta asignatura</p>
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

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <span className="text-sm text-gray-600">Mostrando <span className="font-semibold">{averages.length}</span> estudiante{averages.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                    {grades.map((grade, idx) => (
                      <tr key={`${grade.studentId}-${grade.assignmentTitle}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.studentName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {grade.assignmentTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            let fileCount = 0;
                            let uploadIds: string[] = [];
                            
                            if (grade.assignmentUploadIds) {
                              uploadIds = grade.assignmentUploadIds.split(',').filter(id => id.trim());
                              fileCount = uploadIds.length;
                            } else if (grade.assignmentUploadId) {
                              uploadIds = [grade.assignmentUploadId];
                              fileCount = 1;
                            }
                            
                            const handleDownload = (storagePath: string) => {
                              window.open(`/api/documents/assignment/${storagePath}`, '_blank');
                            };
                            
                            return fileCount > 0 && grade.assignmentStoragePath ? (
                              <button
                                onClick={() => handleDownload(grade.assignmentStoragePath!)}
                                className="flex items-center gap-2 text-sm text-gray-900 hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors"
                              >
                                <div className="w-8 h-10 flex items-center justify-center bg-red-50 rounded border border-red-200">
                                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <span className="text-xs">{fileCount} archivo{fileCount > 1 ? 's' : ''}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">Sin archivo</span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {grade.submissionStoragePath ? (
                            <button
                              onClick={() => window.open(`/api/documents/assignment/${grade.submissionStoragePath}`, '_blank')}
                              className="flex items-center gap-2 text-sm text-gray-900 hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors"
                            >
                              <div className="w-8 h-10 flex items-center justify-center bg-green-50 rounded border border-green-200">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
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
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`text-sm font-medium ${
                            grade.score === grade.maxScore ? 'text-green-800' :
                            (grade.score / grade.maxScore) >= 0.7 ? 'text-green-600' :
                            (grade.score / grade.maxScore) >= 0.5 ? 'text-orange-500' :
                            'text-red-600'
                          }`}>
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
