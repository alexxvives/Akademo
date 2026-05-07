import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import type { EnrolledClass, ActiveStream } from './types';

interface ClassCardProps {
  classItem: EnrolledClass;
  activeStreams: ActiveStream[];
  onClassClick: (classItem: EnrolledClass, e: React.MouseEvent) => void;
  onViewDocument: (classItem: EnrolledClass) => void;
}

export default function ClassCard({ classItem, activeStreams, onClassClick, onViewDocument }: ClassCardProps) {
  const liveStream = activeStreams.find(s => s.classId === classItem.id);
  const needsSignature = !classItem.documentSigned;

  return (
    <div
      data-class-id={classItem.id}
      className="block bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-4 sm:p-6 group cursor-pointer relative"
    >
      <div
        onClick={(e) => onClassClick(classItem, e)}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-2"
      >
        <div className="flex-1 min-w-0 pr-10 sm:pr-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{classItem.name}</h3>
              {(classItem.university || classItem.carrera) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {classItem.university && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {classItem.university}
                    </span>
                  )}
                  {classItem.carrera && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {classItem.carrera}
                    </span>
                  )}
                </div>
              )}
              {classItem.whatsappGroupLink && (
                <a
                  href={classItem.whatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="relative group/whatsapp"
                  title="Grupo WhatsApp"
                >
                  <svg className="w-5 h-5 text-green-500 hover:text-green-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
              {needsSignature ? (
                <div className="relative group/shield">
                  <Image src="/icons/shield-broken.svg" alt="Firma requerida" width={28} height={28} className="drop-shadow-sm" />
                  <div className="hidden sm:block absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/shield:opacity-100 transition-opacity z-10">
                    Firma requerida
                  </div>
                </div>
              ) : (
                <div
                  className="relative group/shield-signed cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDocument(classItem);
                  }}
                >
                  <Image src="/icons/shield-verified.svg" alt="Documentos firmados" width={28} height={28} className="drop-shadow-sm hover:scale-110 transition-transform" />
                  <div className="hidden sm:block absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/shield-signed:opacity-100 transition-opacity z-10">
                    Ver documento firmado
                  </div>
                </div>
              )}

              {/* Payment Status Icon */}
              {classItem.paymentStatus !== 'PAID' && classItem.paymentStatus !== 'COMPLETED' && (
                (classItem.paymentStatus === 'PENDING' && (classItem.paymentMethod === 'cash' || classItem.paymentMethod === 'transferencia')) ? (
                  <div className="relative group/payment">
                    <svg className="w-6 h-6 text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="hidden sm:block absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/payment:opacity-100 transition-opacity z-10">
                      {classItem.paymentMethod === 'cash' ? 'Esperando aprobación de la academia (efectivo)' : 'Esperando aprobación de la academia (transferencia)'}
                    </div>
                  </div>
                ) : (
                  <div className="relative group/payment">
                    <svg className="w-6 h-6 text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="hidden sm:block absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/payment:opacity-100 transition-opacity z-10">
                      Pago requerido
                    </div>
                  </div>
                )
              )}

              {liveStream && (
                <span className="flex items-center gap-1.5 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold border border-red-200">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  EN VIVO
                </span>
              )}
            </div>

            {/* Abandonar Clase Button */}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm('¿Estás seguro de que quieres abandonar esta clase? Esta acción cancelará tu suscripción y no podrás acceder más al contenido.')) {
                  try {
                    const res = await apiClient('/enrollments/leave', {
                      method: 'POST',
                      body: JSON.stringify({ classId: classItem.id }),
                    });
                    const result = await res.json();
                    if (result.success) {
                      alert('Has abandonado la clase exitosamente');
                      window.location.reload();
                    } else {
                      alert('Error al abandonar la clase: ' + (result.error || 'Error desconocido'));
                    }
                  } catch (error) {
                    console.error('Error leaving class:', error);
                    alert('Error al abandonar la clase');
                  }
                }
              }}
              aria-label="Abandonar Clase"
              title="Abandonar Clase"
              className="absolute top-3 right-3 sm:static flex items-center gap-2 p-2 sm:px-3 sm:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium text-sm border border-red-200 shrink-0 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Abandonar Clase</span>
            </button>
          </div>
          {classItem.description ? (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{classItem.description}</p>
          ) : (
            <p className="text-sm text-gray-400 italic mb-4">Sin descripción</p>
          )}

          {/* Teacher Info */}
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
            <span className="font-medium">Profesor:</span>
            <span>
              {classItem.teacherFirstName && classItem.teacherLastName
                ? `${classItem.teacherFirstName} ${classItem.teacherLastName}`
                : 'Sin asignar'
              }
            </span>
          </div>

          {/* Date */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {classItem.startDate
                ? new Date(classItem.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                : new Date(classItem.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
