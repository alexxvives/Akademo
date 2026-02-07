'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Bar } from 'react-chartjs-2';
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

interface Academy {
  id: string;
  name: string;
}

export default function AdminGrades() {
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [averages, setAverages] = useState<StudentAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedAcademy, setSelectedAcademy] = useState<string>('');
  const [classes, setClasses] = useState<{id: string; name: string}[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);

  useEffect(() => {
    loadAcademies();
  }, []);

  useEffect(() => {
    if (selectedAcademy) {
      loadClasses();
    }
  }, [selectedAcademy]);

  useEffect(() => {
    if (selectedClass && selectedAcademy) {
      loadGrades();
    }
  }, [selectedClass, selectedAcademy]);

  const loadAcademies = async () => {
    try {
      const res = await apiClient('/academies');
      const response: any = await res.json();
      if (response.success) {
        setAcademies(response.data);
        if (response.data.length > 0) {
          setSelectedAcademy('all'); // Default to 'all'
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('[Admin Grades] Error loading academies:', error);
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const endpoint = selectedAcademy === 'all' ? '/classes' : `/classes?academyId=${selectedAcademy}`;
      const res = await apiClient(endpoint);
      const response: any = await res.json();
      if (response.success) {
        setClasses(response.data);
        if (response.data.length > 0) {
          setSelectedClass('all'); // Default to 'all'
        } else {
          setSelectedClass('');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('[Admin Grades] Error loading classes:', error);
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    setLoading(true);
    try {
      // Get all assignments for the class (or all classes if 'all' is selected)
      let endpoint: string;
      if (selectedAcademy === 'all') {
        endpoint = selectedClass === 'all' ? '/assignments/all' : `/assignments?classId=${selectedClass}`;
      } else {
        endpoint = selectedClass === 'all' ? `/assignments?academyId=${selectedAcademy}` : `/assignments?classId=${selectedClass}`;
      }
      
      const assignmentsRaw = await apiClient(endpoint);
      const assignmentsRes: any = await assignmentsRaw.json();
      
      if (!assignmentsRes.success) {
        setLoading(false);
        return;
      }

      // Get submissions for each assignment
      const allGrades: StudentGrade[] = [];
      for (const assignment of assignmentsRes.data) {
        const assignmentRaw = await apiClient(`/assignments/${assignment.id}`);
        const assignmentRes: any = await assignmentRaw.json();
        if (assignmentRes.success && assignmentRes.data.submissions) {
          assignmentRes.data.submissions.forEach((sub: any) => {
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
                assignmentUploadId: assignment.uploadId,
                submissionUploadId: sub.uploadId,
                assignmentStoragePath: assignmentRes.data.attachmentStoragePath,
                submissionStoragePath: sub.submissionStoragePath
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
  };

  const top10Averages = averages.slice(0, 10);

  const chartData = {
    labels: top10Averages.map(a => {
      const parts = a.studentName.split(' ');
      return `${parts[0]} ${parts.slice(1).join(' ')}`;
    }),
    datasets: [{
      label: 'Promedio (%)',
      data: top10Averages.map(a => a.averageGrade),
      backgroundColor: top10Averages.map(a => 
        a.averageGrade === 100 ? 'rgba(22, 101, 52, 0.8)' :
        a.averageGrade >= 70 ? 'rgba(5, 150, 105, 0.8)' :
        a.averageGrade >= 50 ? 'rgba(249, 115, 22, 0.8)' :
        'rgba(220, 38, 38, 0.8)'
      ),
      borderColor: top10Averages.map(a => 
        a.averageGrade === 100 ? 'rgb(22, 101, 52)' :
        a.averageGrade >= 70 ? 'rgb(5, 150, 105)' :
        a.averageGrade >= 50 ? 'rgb(249, 115, 22)' :
        'rgb(220, 38, 38)'
      ),
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
          label: (context: any) => {
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
          callback: (value: any) => value + '%'
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
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (academies.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Calificaciones</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-gray-900 font-medium mb-2">No hay academias disponibles</div>
          <p className="text-gray-500">No hay academias registradas en la plataforma.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Calificaciones</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Academy Filter */}
          <div className="relative">
            <select
              value={selectedAcademy}
              onChange={(e) => setSelectedAcademy(e.target.value)}
              className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">Todas las academias</option>
              {academies.map(academy => (
                <option key={academy.id} value={academy.id}>{academy.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Class Filter */}
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              disabled={classes.length === 0}
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
      </div>

      {averages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No hay calificaciones para mostrar</p>
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
              <div className="overflow-x-auto">
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
