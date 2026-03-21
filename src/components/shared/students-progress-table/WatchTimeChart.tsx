'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { StudentProgress } from './types';
import { formatTime } from './utils';

interface WatchTimeChartProps {
  filteredStudents: StudentProgress[];
}

export function WatchTimeChart({ filteredStudents }: WatchTimeChartProps) {
  const chartData = useMemo(() => {
    return filteredStudents
      .slice(0, 10)
      .map((student, index) => {
        const parts = student.name.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');
        const displayName = `${firstName}_${index}`;
        return {
          id: student.id,
          name: displayName,
          displayFirstName: firstName,
          lastName: lastName,
          fullName: student.name,
          minutes: student.totalWatchTime,
        };
      });
  }, [filteredStudents]);

  if (filteredStudents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tiempo de Visualización</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">No hay datos</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tiempo de Visualización</h3>
        <p className="text-sm text-gray-500">Solo muestra los top 10 estudiantes</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            tick={({ x, y, payload }) => {
              const dataPoint = chartData.find(d => d.name === payload.value);
              return (
                <text x={x} y={y} textAnchor="middle" fill="#6b7280">
                  <tspan x={x} dy="0.71em" fontSize="12">{dataPoint?.displayFirstName}</tspan>
                  <tspan x={x} dy="1.2em" fontSize="11">{dataPoint?.lastName}</tspan>
                </text>
              );
            }}
            height={50}
          />
          <YAxis stroke="#6b7280" tickFormatter={(value: number) => value >= 3600 ? `${Math.round(value / 3600)}h` : value >= 60 ? `${Math.round(value / 60)}m` : `${value}s`} />
          <Tooltip
            content={({ payload }) => {
              if (payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{data.fullName}</p>
                    <p className="text-sm text-gray-600">{formatTime(data.minutes)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.id}`} fill="#6366f1" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
