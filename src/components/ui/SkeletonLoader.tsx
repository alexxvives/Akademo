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

export function SkeletonFeedback() {
  return (
    <div className="space-y-6">
      {/* Page Header - Reserves space for title + subtitle to prevent layout shift */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-56" /> {/* Title */}
          <SkeletonBox className="h-4 w-40" /> {/* Subtitle */}
        </div>
        <SkeletonBox className="h-10 w-32" />
      </div>
      
      {/* Cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <SkeletonBox className="h-6 w-48" />
              <SkeletonBox className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-6 w-16" />
              <SkeletonBox className="h-6 w-12" />
            </div>
          </div>
          
          {/* Lessons */}
          <div className="space-y-3 pt-3 border-t">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <SkeletonBox className="h-4 w-64" />
                <SkeletonBox className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header - Reserves space for title + subtitle to prevent layout shift */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-56" /> {/* Title */}
          <SkeletonBox className="h-4 w-40" /> {/* Subtitle */}
        </div>
        <SkeletonBox className="h-10 w-40" /> {/* Optional filter */}
      </div>
      
      {/* Stats Grid */}
      <SkeletonStats />
      
      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <SkeletonBox className="h-6 w-32" />
          <SkeletonBox className="h-64 w-full" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <SkeletonBox className="h-6 w-32" />
          <SkeletonBox className="h-64 w-full" />
        </div>
      </div>
      
      {/* List Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <SkeletonBox className="h-6 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
            <div className="flex items-center gap-4">
              <SkeletonBox className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <SkeletonBox className="h-4 w-48" />
                <SkeletonBox className="h-3 w-32" />
              </div>
            </div>
            <SkeletonBox className="h-8 w-20" />
          </div>
        ))}
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
    <div className="max-w-4xl space-y-6">
      {/* Page Header - Reserves space for title + subtitle to prevent layout shift */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-56" /> {/* Title */}
          <SkeletonBox className="h-4 w-40" /> {/* Subtitle */}
        </div>
      </div>
      
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-6 mb-6">
          <SkeletonBox className="h-24 w-24 rounded-full" />
          <div className="space-y-3 flex-1">
            <SkeletonBox className="h-8 w-64" />
            <SkeletonBox className="h-5 w-48" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-10 w-full" />
          </div>
        </div>
      </div>
      
      {/* Additional Sections */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-4">
        <SkeletonBox className="h-6 w-48" />
        <div className="space-y-3">
          <SkeletonBox className="h-10 w-full" />
          <SkeletonBox className="h-10 w-full" />
          <SkeletonBox className="h-10 w-full" />
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
