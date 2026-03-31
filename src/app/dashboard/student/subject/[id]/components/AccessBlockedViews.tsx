'use client';

import Link from 'next/link';
import { parseDateString } from '@/lib/formatters';
import type { ClassData } from './types';

export function AccessLockedView({ classData }: { classData: ClassData | null }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Acceso restringido</h2>
      <p className="text-gray-500 mb-2">
        Tu acceso a <span className="font-semibold text-gray-700">{classData?.name}</span> está temporalmente bloqueado.
      </p>
      <p className="text-gray-500 mb-6">
        Tienes un pago mensual pendiente. Contacta con tu academia para regularizar tu situación.
      </p>
      <Link href="/dashboard/student/subjects" className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
        ← Volver a mis asignaturas
      </Link>
    </div>
  );
}

export function ClassNotStartedView({ classData }: { classData: ClassData }) {
  const startDate = parseDateString(classData.startDate!);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Esta asignatura aún no ha comenzado</h2>
      <p className="text-gray-500 mb-1">
        <span className="font-medium text-gray-700">{classData.name}</span>
      </p>
      <p className="text-gray-500 mb-6">
        Empieza el <span className="font-semibold text-gray-700">{startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </p>
      <Link href="/dashboard/student/subjects" className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
        ← Volver a mis asignaturas
      </Link>
    </div>
  );
}
