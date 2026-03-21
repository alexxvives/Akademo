'use client';

import { SkeletonBox } from './primitives';

export function SkeletonDashboard() {
  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-56" />
          <SkeletonBox className="h-4 w-40" />
        </div>
        <div className="flex gap-3">
          <SkeletonBox className="h-10 w-56" />
          <SkeletonBox className="h-10 w-56" />
        </div>
      </div>

      {/* 2×2 Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Estudiantes — 2-col grid layout */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
          <SkeletonBox className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-2 gap-4">
            {/* Left col: Estudiantes + Matrículas boxes */}
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg gap-3">
                  <div className="flex flex-col items-center shrink-0 min-w-[72px] gap-1">
                    <SkeletonBox className="h-10 w-14" />
                    <SkeletonBox className="h-3 w-16" />
                  </div>
                  <div className="flex-1 ml-2 pl-2 border-l border-gray-200 space-y-2">
                    <div className="flex justify-between">
                      <SkeletonBox className="h-3 w-10" />
                      <SkeletonBox className="h-4 w-8" />
                    </div>
                    <div className="flex justify-between">
                      <SkeletonBox className="h-3 w-14" />
                      <SkeletonBox className="h-4 w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Right col: Total Cobrado + payment methods */}
            <div className="flex flex-col gap-3">
              <div className="flex-1 flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg gap-1">
                <SkeletonBox className="h-10 w-24" />
                <SkeletonBox className="h-3 w-24" />
              </div>
              <div className="flex-1 flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-lg">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="text-center min-w-[60px]">
                    <SkeletonBox className="h-3 w-12 mx-auto mb-1" />
                    <SkeletonBox className="h-8 w-8 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Participación */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
          <SkeletonBox className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <SkeletonBox className="h-4 w-52" />
                  <SkeletonBox className="h-4 w-10" />
                </div>
                <SkeletonBox className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Valoraciones — 5 rating bars */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
          <SkeletonBox className="h-6 w-32 mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBox className="h-4 w-6 shrink-0" />
                <SkeletonBox className="h-4 flex-1 rounded-full" />
                <SkeletonBox className="h-4 w-8 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Actividad — donut chart placeholder */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
          <SkeletonBox className="h-6 w-24 mb-6" />
          <div className="flex items-center justify-center h-40">
            <SkeletonBox className="h-36 w-36 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
