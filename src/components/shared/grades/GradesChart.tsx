'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { StudentAverage } from './types';
import { buildChartData, buildChartOptions } from './grades-utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GradesChartProps {
  top10Averages: StudentAverage[];
}

export function GradesChart({ top10Averages }: GradesChartProps) {
  const chartData = buildChartData(top10Averages);
  const chartOptions = buildChartOptions(top10Averages);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Promedios por Estudiante</h2>
        <p className="text-sm text-gray-500">Solo muestra los top 10 estudiantes</p>
      </div>
      <div className="h-80">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
