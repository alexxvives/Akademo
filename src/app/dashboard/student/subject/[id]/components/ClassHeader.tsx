'use client';

import Link from 'next/link';
import type { ClassData, ActiveStream } from './types';

interface ClassHeaderProps {
  classData: ClassData;
  activeStream: ActiveStream | null;
}

export default function ClassHeader({ classData, activeStream }: ClassHeaderProps) {
  return (
    <>
      <Link href="/dashboard/student/subjects" className="text-sm text-gray-500 hover:text-gray-900 inline-block">
        ← Volver a asignaturas
      </Link>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">{classData.name}</h1>
          {classData.description && (
            <p className="text-gray-600 text-base sm:text-lg max-w-3xl">{classData.description}</p>
          )}
        </div>

        {activeStream && (
          <div className="flex-shrink-0 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-red-600 text-sm font-semibold">En Vivo</span>
            </div>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600 text-sm">{activeStream.teacherName}</span>
            <Link
              href={`/dashboard/student/live/${activeStream.id}`}
              className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Unirse
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
