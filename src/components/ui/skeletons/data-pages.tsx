'use client';

import { SkeletonBox } from './primitives';

export function SkeletonFeedback() {
  return (
    <div className="space-y-6">
      {/* Class Filter */}
      <div className="flex justify-end">
        <SkeletonBox className="h-10 w-56" />
      </div>

      {/* Class feedback cards */}
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Class header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-6 w-48" />
                  <SkeletonBox className="h-5 w-16 rounded-full" />
                  <SkeletonBox className="h-5 w-20 rounded-full" />
                </div>
                <SkeletonBox className="h-4 w-32" />
              </div>
              <div className="sm:text-right space-y-1">
                <div className="flex items-center gap-2">
                  <SkeletonBox className="h-7 w-10" />
                  <SkeletonBox className="h-4 w-24" />
                </div>
                <SkeletonBox className="h-4 w-28" />
              </div>
            </div>
          </div>
          {/* Topic rows */}
          <div className="divide-y divide-gray-200">
            {[1, 2, 3].map((j) => (
              <div key={j} className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-5 w-5 rounded" />
                  <SkeletonBox className="h-5 w-36" />
                </div>
                <div className="flex items-center gap-4">
                  <SkeletonBox className="h-5 w-10" />
                  <SkeletonBox className="h-4 w-24" />
                  <SkeletonBox className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPayments() {
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <SkeletonBox className="h-10 w-32" /> {/* Pendientes */}
          <SkeletonBox className="h-10 w-32" /> {/* Historial */}
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SkeletonBox className="h-10 w-64" /> {/* Search input */}
        <div className="flex gap-2">
          <SkeletonBox className="h-10 w-48" /> {/* Class filter */}
          <SkeletonBox className="h-10 w-32" /> {/* Register payment button */}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-6 gap-4">
            <SkeletonBox className="h-4 w-24" /> {/* Estudiante */}
            <SkeletonBox className="h-4 w-20" /> {/* Asignatura */}
            <SkeletonBox className="h-4 w-20" /> {/* Monto */}
            <SkeletonBox className="h-4 w-24" /> {/* Método */}
            <SkeletonBox className="h-4 w-20" /> {/* Estado */}
            <SkeletonBox className="h-4 w-20" /> {/* Acciones */}
          </div>
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="space-y-1">
                  <SkeletonBox className="h-5 w-32" /> {/* Name */}
                  <SkeletonBox className="h-3 w-40" /> {/* Email */}
                </div>
                <SkeletonBox className="h-4 w-28" /> {/* Class */}
                <SkeletonBox className="h-5 w-16" /> {/* Amount */}
                <SkeletonBox className="h-6 w-20 rounded-full" /> {/* Method badge */}
                <SkeletonBox className="h-6 w-24 rounded-full" /> {/* Status badge */}
                <SkeletonBox className="h-8 w-20" /> {/* Action button */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonAssignments() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-36" /> {/* Ejercicios */}
          <SkeletonBox className="h-4 w-56" /> {/* subtitle */}
        </div>
        <SkeletonBox className="h-10 w-72" /> {/* Class dropdown */}
      </div>

      {/* Assignments table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-6 gap-4">
            <SkeletonBox className="h-4 w-28" /> {/* Título */}
            <SkeletonBox className="h-4 w-24" /> {/* Asignatura */}
            <SkeletonBox className="h-4 w-20" /> {/* Fecha límite */}
            <SkeletonBox className="h-4 w-16" /> {/* Nota */}
            <SkeletonBox className="h-4 w-20" /> {/* Estado */}
            <SkeletonBox className="h-4 w-16" /> {/* Acción */}
          </div>
        </div>
        {/* Rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                <SkeletonBox className="h-5 w-40" />
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-4 w-12" />
                <SkeletonBox className="h-6 w-24 rounded-full" />
                <SkeletonBox className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
