'use client';

import { SkeletonBox } from './primitives';

export function SkeletonClasses() {
  return (
    <div className="space-y-6">
      {/* Page Header - Reserves space for title + subtitle to prevent layout shift */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-56" /> {/* Title */}
          <SkeletonBox className="h-4 w-40" /> {/* Subtitle */}
        </div>
        <SkeletonBox className="h-11 w-36" />
      </div>
      
      {/* Class Cards - Vertical Stack like actual layout */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-6 w-64" /> {/* Class name */}
                  <SkeletonBox className="h-6 w-16 rounded-full" /> {/* Rating badge */}
                </div>
                <SkeletonBox className="h-4 w-3/4" /> {/* Description */}
                {/* Stats row */}
                <div className="flex items-center gap-6">
                  <SkeletonBox className="h-4 w-24" /> {/* Students */}
                  <SkeletonBox className="h-4 w-24" /> {/* Lessons */}
                  <SkeletonBox className="h-4 w-20" /> {/* Videos */}
                  <SkeletonBox className="h-4 w-28" /> {/* Documents */}
                  <SkeletonBox className="h-4 w-32" /> {/* Date */}
                </div>
              </div>
              {/* Right side badge */}
              <SkeletonBox className="h-12 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStudentClass() {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <SkeletonBox className="h-5 w-40" />
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-4 flex-wrap">
            <SkeletonBox className="h-8 w-64" /> {/* Class name */}
          </div>
          <SkeletonBox className="h-5 w-96" /> {/* Description */}
        </div>
      </div>

      {/* Topics and Lessons List */}
      <div className="space-y-4">
        {/* Topics */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Topic Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <SkeletonBox className="h-5 w-5" /> {/* Expand icon */}
                  <SkeletonBox className="h-5 w-48" /> {/* Topic name */}
                  <SkeletonBox className="h-5 w-20 rounded-full" /> {/* Lesson count badge */}
                </div>
              </div>
            </div>
            
            {/* Lessons */}
            <div className="divide-y divide-gray-200">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <SkeletonBox className="h-5 w-64" /> {/* Lesson title */}
                      <div className="flex items-center gap-4">
                        <SkeletonBox className="h-4 w-20" /> {/* Video count */}
                        <SkeletonBox className="h-4 w-24" /> {/* Duration */}
                        <SkeletonBox className="h-4 w-28" /> {/* Progress */}
                      </div>
                    </div>
                    <SkeletonBox className="h-20 w-36 rounded-lg" /> {/* Thumbnail */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonClassDetail() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <SkeletonBox className="h-4 w-40" />

      {/* Header: title + action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-8 w-72" />
          <SkeletonBox className="h-5 w-full max-w-xl" />
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-9 w-28 rounded-lg" />
          <SkeletonBox className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* "Clases" section header + "Nuevo Tema" button */}
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-6 w-16" />
        <SkeletonBox className="h-9 w-28 rounded-lg" />
      </div>

      {/* Topic group 1 */}
      <div className="space-y-3">
        <SkeletonBox className="h-10 w-full rounded-xl" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-5 w-56" />
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-4 w-16" />
                  <SkeletonBox className="h-4 w-20" />
                  <SkeletonBox className="h-4 w-24" />
                </div>
              </div>
              <SkeletonBox className="h-16 w-28 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Topic group 2 */}
      <div className="space-y-3">
        <SkeletonBox className="h-10 w-full rounded-xl" />
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-5 w-48" />
              <div className="flex items-center gap-3">
                <SkeletonBox className="h-4 w-16" />
                <SkeletonBox className="h-4 w-24" />
              </div>
            </div>
            <SkeletonBox className="h-16 w-28 rounded-lg flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonStudents() {
  return (
    <div className="space-y-6">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SkeletonBox className="h-10 w-64" /> {/* Search input */}
        <SkeletonBox className="h-10 w-48" /> {/* Class filter dropdown */}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-5 gap-4">
            <SkeletonBox className="h-4 w-24" /> {/* Nombre */}
            <SkeletonBox className="h-4 w-20" /> {/* Asignatura */}
            <SkeletonBox className="h-4 w-28" /> {/* Videos vistos */}
            <SkeletonBox className="h-4 w-32" /> {/* Tiempo total */}
            <SkeletonBox className="h-4 w-28" /> {/* Última actividad */}
          </div>
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="space-y-1">
                  <SkeletonBox className="h-5 w-32" /> {/* Name */}
                  <SkeletonBox className="h-3 w-40" /> {/* Email */}
                </div>
                <SkeletonBox className="h-4 w-36" /> {/* Class */}
                <SkeletonBox className="h-4 w-16" /> {/* Videos */}
                <SkeletonBox className="h-4 w-20" /> {/* Time */}
                <SkeletonBox className="h-4 w-24" /> {/* Last active */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
