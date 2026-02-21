'use client';

/**
 * Skeleton loading components for various UI patterns
 * Provides smooth animated placeholders while content loads
 */

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return <SkeletonBox className={`h-4 ${className}`} />;
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-6">
      {/* Page Header - Reserves space for title + subtitle to prevent layout shift */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-56" /> {/* Title */}
          <SkeletonBox className="h-4 w-40" /> {/* Subtitle */}
        </div>
        <SkeletonBox className="h-10 w-32" /> {/* Optional button/filter */}
      </div>
      
      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-4">
            <SkeletonBox className="h-10 w-64" />
            <SkeletonBox className="h-10 w-40" />
          </div>
        </div>
        
        {/* Table Header */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, i) => (
              <SkeletonBox key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
        
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="border-b border-gray-200 p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <SkeletonBox key={colIdx} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-6 w-3/4" />
          <SkeletonBox className="h-4 w-1/2" />
        </div>
        <SkeletonBox className="h-10 w-10 rounded-full" />
      </div>
      <div className="space-y-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-8 w-16" />
          <SkeletonBox className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="w-full space-y-6">
      {/* Page Header with Class Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-56" /> {/* Title: Panel de Control */}
          <SkeletonBox className="h-4 w-40" /> {/* Subtitle: Academy name */}
        </div>
        {/* Class Filter Dropdown */}
        <SkeletonBox className="h-10 w-56" />
      </div>

      {/* Visual Analytics Grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Metrics Card - LEFT */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
          <SkeletonBox className="h-6 w-32 mb-6" /> {/* Title: Participación */}
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <SkeletonBox className="h-4 w-48" />
                  <SkeletonBox className="h-4 w-16" />
                </div>
                <SkeletonBox className="h-2 w-full rounded-full" /> {/* Progress bar */}
              </div>
            ))}
          </div>
        </div>

        {/* Student Summary Card - RIGHT */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
          <SkeletonBox className="h-6 w-32 mb-6" /> {/* Title: Estudiantes */}
          <div className="space-y-6">
            <div className="text-center">
              <SkeletonBox className="h-14 w-24 mx-auto mb-2" /> {/* Big number */}
              <SkeletonBox className="h-4 w-48 mx-auto" /> {/* Description */}
            </div>
            {/* Stats row */}
            <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-1 text-center">
                  <SkeletonBox className="h-8 w-12 mx-auto mb-1" />
                  <SkeletonBox className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Card - LEFT */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <SkeletonBox className="h-6 w-24" /> {/* Title: Clases */}
            <SkeletonBox className="h-8 w-24" /> {/* Ver todas button */}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <SkeletonBox className="h-5 w-48 mb-2" />
                  <SkeletonBox className="h-4 w-32" />
                </div>
                <SkeletonBox className="h-8 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Students Card - RIGHT */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <SkeletonBox className="h-6 w-48" /> {/* Title */}
            <SkeletonBox className="h-8 w-24" /> {/* Ver todos button */}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBox className="h-10 w-10 rounded-full" /> {/* Avatar */}
                <div className="flex-1">
                  <SkeletonBox className="h-4 w-32 mb-1" />
                  <SkeletonBox className="h-3 w-24" />
                </div>
                <SkeletonBox className="h-6 w-20 rounded-full" /> {/* Badge */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      {/* Page Header - Reserves space for title + subtitle to prevent layout shift */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-56" /> {/* Title */}
          <SkeletonBox className="h-4 w-40" /> {/* Subtitle */}
        </div>
        <SkeletonBox className="h-10 w-32" /> {/* Optional button */}
      </div>
      
      {/* Content Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Search/Filter Bar */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-10 w-64" />
            <SkeletonBox className="h-10 w-40" />
          </div>
        </div>
        
        {/* List Items */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <SkeletonBox className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <SkeletonBox className="h-5 w-3/4" />
                    <SkeletonBox className="h-4 w-1/2" />
                  </div>
                </div>
                <SkeletonBox className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-56" /> {/* Title: Configuración */}
          <SkeletonBox className="h-4 w-80" /> {/* Subtitle */}
        </div>
      </div>

      {/* Academy Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Card Header */}
        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <SkeletonBox className="h-6 w-48" /> {/* Title */}
              <SkeletonBox className="h-4 w-64" /> {/* Subtitle */}
            </div>
            <SkeletonBox className="h-10 w-24" /> {/* Edit button */}
          </div>
        </div>

        {/* Card Body */}
        <div className="px-8 py-6">
          {/* Nombre y Logo - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
            {/* Nombre */}
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-40" /> {/* Label */}
              <SkeletonBox className="h-12 w-full" /> {/* Input */}
            </div>
            {/* Logo */}
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-32 mx-auto" /> {/* Label */}
              <div className="flex items-center justify-center gap-3">
                <SkeletonBox className="h-16 w-16 rounded-lg" /> {/* Logo preview */}
                <SkeletonBox className="h-10 w-32" /> {/* Upload button */}
              </div>
            </div>
          </div>

          {/* Contact Info - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-16" /> {/* Email label */}
              <SkeletonBox className="h-11 w-full" /> {/* Input */}
            </div>
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-20" /> {/* Phone label */}
              <SkeletonBox className="h-11 w-full" /> {/* Input */}
            </div>
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-32" /> {/* Address label */}
              <SkeletonBox className="h-11 w-full" /> {/* Input */}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-5 bg-gray-50 border-b border-gray-200">
          <div className="space-y-1">
            <SkeletonBox className="h-5 w-56" /> {/* Title */}
            <SkeletonBox className="h-4 w-72" /> {/* Subtitle */}
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4 settings items */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <SkeletonBox className="h-4 w-40" /> {/* Label */}
                <SkeletonBox className="h-3 w-64" /> {/* Description */}
                <SkeletonBox className="h-7 w-28" /> {/* Toggle/Select */}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Methods Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-5 bg-gray-50 border-b border-gray-200">
          <div className="space-y-1">
            <SkeletonBox className="h-5 w-64" /> {/* Title */}
            <SkeletonBox className="h-4 w-80" /> {/* Subtitle */}
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 3 payment method cards */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border-2 border-gray-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <SkeletonBox className="h-5 w-5 rounded-full" /> {/* Checkbox */}
                  <div className="flex-1 space-y-2">
                    <SkeletonBox className="h-4 w-20" /> {/* Method name */}
                    <SkeletonBox className="h-3 w-32" /> {/* Description */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zoom Accounts Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <SkeletonBox className="h-6 w-48 bg-gray-700" /> {/* Title */}
              <SkeletonBox className="h-4 w-80 bg-gray-700" /> {/* Subtitle */}
            </div>
            <SkeletonBox className="h-10 w-40 bg-gray-700" /> {/* Connect button */}
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="text-center py-12">
            <SkeletonBox className="h-16 w-16 rounded-full mx-auto mb-4" />
            <SkeletonBox className="h-5 w-48 mx-auto mb-2" />
            <SkeletonBox className="h-4 w-64 mx-auto" />
          </div>
        </div>
      </div>

      {/* Stripe Connect Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
        <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <SkeletonBox className="h-6 w-48 bg-indigo-700" /> {/* Title */}
              <SkeletonBox className="h-4 w-96 bg-indigo-700" /> {/* Subtitle */}
            </div>
            <SkeletonBox className="h-10 w-40 bg-white/20" /> {/* Connect button */}
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="text-center py-12">
            <SkeletonBox className="h-16 w-16 rounded-full mx-auto mb-4" />
            <SkeletonBox className="h-5 w-48 mx-auto mb-2" />
            <SkeletonBox className="h-4 w-80 mx-auto mb-6" />
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
              <SkeletonBox className="h-5 w-56 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonBox key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8 space-y-6">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-64" />
        <SkeletonBox className="h-5 w-96" />
      </div>
      
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBox className="h-4 w-32" />
          <SkeletonBox className="h-12 w-full" />
        </div>
      ))}
      
      <div className="flex justify-end gap-3 pt-4">
        <SkeletonBox className="h-11 w-24" />
        <SkeletonBox className="h-11 w-32" />
      </div>
    </div>
  );
}

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
      {/* Back button + Header */}
      <SkeletonBox className="h-5 w-40 mb-4" />
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-8 w-96" /> {/* Class name */}
          <SkeletonBox className="h-5 w-full max-w-2xl" /> {/* Description */}
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-10 w-32" /> {/* Button */}
          <SkeletonBox className="h-10 w-32" /> {/* Button */}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6">
        <SkeletonBox className="h-6 w-24" />
        <SkeletonBox className="h-6 w-24" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} className="h-10 w-24" />
          ))}
        </div>
      </div>

      {/* Content Area - Lessons List */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-6 w-64" /> {/* Lesson title */}
                <div className="flex items-center gap-4">
                  <SkeletonBox className="h-4 w-20" /> {/* Videos */}
                  <SkeletonBox className="h-4 w-20" /> {/* Documents */}
                  <SkeletonBox className="h-4 w-28" /> {/* Release date */}
                </div>
              </div>
              <SkeletonBox className="h-20 w-36 rounded-lg" /> {/* Thumbnail */}
            </div>
          </div>
        ))}
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

export function SkeletonLiveStreams() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-44" /> {/* Clases en Vivo */}
        <SkeletonBox className="h-4 w-64" /> {/* subtitle */}
      </div>

      {/* Stream cards */}
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <SkeletonBox className="h-12 w-12 rounded-xl flex-shrink-0" /> {/* Icon */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <SkeletonBox className="h-5 w-14 rounded-full" /> {/* LIVE badge */}
                  <SkeletonBox className="h-5 w-40" /> {/* Class name */}
                </div>
                <SkeletonBox className="h-4 w-48" /> {/* Teacher name */}
                <SkeletonBox className="h-4 w-32" /> {/* Meeting ID */}
              </div>
            </div>
            <SkeletonBox className="h-10 w-32 rounded-lg flex-shrink-0" /> {/* Join button */}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonAcademyCards() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-4 w-4" /> {/* Back arrow */}
        <SkeletonBox className="h-4 w-32" /> {/* Back link */}
      </div>
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-48" /> {/* Explorar academias */}
        <SkeletonBox className="h-4 w-64" /> {/* subtitle */}
      </div>

      {/* Academy cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <SkeletonBox className="h-5 w-40" /> {/* Academy name */}
              <SkeletonBox className="h-4 w-full" /> {/* Description */}
              <SkeletonBox className="h-4 w-24" /> {/* Teachers count */}
            </div>
            <SkeletonBox className="h-5 w-5 flex-shrink-0" /> {/* Arrow icon */}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonAcademyManage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back link + header */}
      <div className="space-y-4">
        <SkeletonBox className="h-4 w-36" /> {/* ← Back to Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBox className="h-8 w-56" /> {/* Academy name */}
            <SkeletonBox className="h-4 w-80" /> {/* Description */}
          </div>
          <SkeletonBox className="h-10 w-36 rounded-lg" /> {/* Add class button */}
        </div>
      </div>

      {/* Pending memberships section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <SkeletonBox className="h-6 w-44" /> {/* Solicitudes pendientes */}
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 sm:p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <SkeletonBox className="h-5 w-40" /> {/* Name */}
                <SkeletonBox className="h-4 w-48" /> {/* Email */}
              </div>
              <div className="flex gap-2">
                <SkeletonBox className="h-9 w-24 rounded-lg" /> {/* Approve */}
                <SkeletonBox className="h-9 w-20 rounded-lg" /> {/* Reject */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Classes section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <SkeletonBox className="h-6 w-32" /> {/* Asignaturas */}
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 sm:p-6 flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <SkeletonBox className="h-5 w-48" /> {/* Class name */}
                <div className="flex gap-4">
                  <SkeletonBox className="h-4 w-24" /> {/* N students */}
                  <SkeletonBox className="h-4 w-20" /> {/* N videos */}
                </div>
              </div>
              <SkeletonBox className="h-5 w-5" /> {/* Arrow / link */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonTeachers() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-40" /> {/* Profesores */}
          <SkeletonBox className="h-4 w-52" /> {/* subtitle */}
        </div>
        <SkeletonBox className="h-10 w-40 rounded-lg" /> {/* Add teacher */}
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SkeletonBox className="h-10 w-64" /> {/* Search */}
        <SkeletonBox className="h-10 w-48" /> {/* Academy filter (admin) */}
      </div>

      {/* Teachers table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-5 gap-4">
            <SkeletonBox className="h-4 w-24" /> {/* Nombre */}
            <SkeletonBox className="h-4 w-20" /> {/* Asignaturas */}
            <SkeletonBox className="h-4 w-24" /> {/* Estudiantes */}
            <SkeletonBox className="h-4 w-20" /> {/* Desde */}
            <SkeletonBox className="h-4 w-20" /> {/* Acciones */}
          </div>
        </div>
        {/* Rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-9 w-9 rounded-full flex-shrink-0" /> {/* Avatar */}
                  <div className="space-y-1">
                    <SkeletonBox className="h-4 w-28" /> {/* Name */}
                    <SkeletonBox className="h-3 w-36" /> {/* Email */}
                  </div>
                </div>
                <SkeletonBox className="h-4 w-8" />   {/* Class count */}
                <SkeletonBox className="h-4 w-8" />   {/* Student count */}
                <SkeletonBox className="h-4 w-20" />  {/* Date */}
                <div className="flex gap-2">
                  <SkeletonBox className="h-7 w-7 rounded" /> {/* Edit */}
                  <SkeletonBox className="h-7 w-7 rounded" /> {/* Delete */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}