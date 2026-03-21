'use client';

import { SkeletonBox } from './primitives';

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
