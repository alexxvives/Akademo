import { generateDemoAssignments, generateDemoSubmissions } from '@/lib/demo-data';
import type { StudentGrade, StudentAverage } from './types';

export function buildDemoGrades(selectedClass: string): StudentGrade[] {
  const demoAssignments = generateDemoAssignments();
  const filtered =
    selectedClass === 'all' ? demoAssignments : demoAssignments.filter((a) => a.classId === selectedClass);

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
  return gradesData;
}

export function calcAverages(data: StudentGrade[]): StudentAverage[] {
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
  return Array.from(studentMap.entries())
    .map(([id, d]) => ({
      studentId: id,
      studentName: d.name,
      averageGrade: (d.totalScore / d.totalMax) * 100,
      totalAssignments: d.count,
    }))
    .sort((a, b) => b.averageGrade - a.averageGrade);
}

function getBarColor(avg: number, opacity: number): string {
  if (avg === 100) return `rgba(22, 101, 52, ${opacity})`;
  if (avg >= 70) return `rgba(5, 150, 105, ${opacity})`;
  if (avg >= 50) return `rgba(249, 115, 22, ${opacity})`;
  return `rgba(220, 38, 38, ${opacity})`;
}

function getBorderColor(avg: number): string {
  if (avg === 100) return 'rgb(22, 101, 52)';
  if (avg >= 70) return 'rgb(5, 150, 105)';
  if (avg >= 50) return 'rgb(249, 115, 22)';
  return 'rgb(220, 38, 38)';
}

export function buildChartData(top10: StudentAverage[]) {
  return {
    labels: top10.map((a) => a.studentName),
    datasets: [
      {
        label: 'Promedio (%)',
        data: top10.map((a) => Math.round(a.averageGrade)),
        backgroundColor: top10.map((a) => getBarColor(a.averageGrade, 0.8)),
        borderColor: top10.map((a) => getBorderColor(a.averageGrade)),
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };
}

export function buildChartOptions(top10: StudentAverage[]) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number }) => {
            const avg = top10[context.dataIndex];
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
}
