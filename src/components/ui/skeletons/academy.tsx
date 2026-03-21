'use client';

import { SkeletonBox } from './primitives';

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
