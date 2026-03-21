'use client';

import { SkeletonBox } from './primitives';

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
