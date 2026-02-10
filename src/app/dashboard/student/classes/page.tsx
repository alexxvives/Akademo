'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import DocumentSigningModal from '@/components/DocumentSigningModal';
import PaymentModal from '@/components/PaymentModal';
import { SkeletonClasses } from '@/components/ui/SkeletonLoader';

interface EnrolledClass {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  academyName: string;
  teacherFirstName?: string;
  teacherLastName?: string;
  videoCount: number;
  documentCount: number;
  lessonCount: number;
  studentCount: number;
  createdAt: string;
  startDate?: string | null;
  enrollmentStatus?: 'PENDING' | 'APPROVED';
  documentSigned: number;
  whatsappGroupLink?: string;
  paymentStatus?: string; // PENDING, CASH_PENDING, PAID
  paymentMethod?: string; // 'cash', 'bizum', 'stripe'
  price?: number;
  currency?: string;
  allowMonthly?: number;
  allowOneTime?: number;
  monthlyPrice?: number;
  oneTimePrice?: number;
  maxStudents?: number;
}

interface ActiveStream {
  id: string;
  classId: string;
  title: string;
  zoomLink: string;
  className: string;
  teacherName: string;
}

export default function StudentClassesPage() {
  const router = useRouter();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [signingClass, setSigningClass] = useState<EnrolledClass | null>(null);
  const [payingClass, setPayingClass] = useState<EnrolledClass | null>(null);

  useEffect(() => {
    loadData();
    
    // Function to poll active streams
    const pollActiveStreams = () => {
      apiClient('/live/active')
        .then(res => res.json())
        .then(result => {
          if (result.success && Array.isArray(result.data)) {
            setActiveStreams(result.data);
          }
        })
        .catch(err => console.error('Failed to check streams:', err));
    };
    
    // Call immediately on mount
    pollActiveStreams();
    
    // Then poll every 10 seconds
    const interval = setInterval(pollActiveStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const classesRes = await apiClient('/classes');
      const classesResult = await classesRes.json();

      if (classesResult.success && Array.isArray(classesResult.data)) {
        const classes = classesResult.data.map((c: { id: string; slug?: string; name: string; description?: string; academyName?: string; teacherFirstName?: string; teacherLastName?: string; videoCount?: number; documentCount?: number; lessonCount?: number; studentCount?: number; createdAt: string; startDate?: string; enrollmentStatus?: string; documentSigned?: number; whatsappGroupLink?: string; paymentStatus?: string; paymentMethod?: string; price?: number; currency?: string; allowMonthly?: number; allowOneTime?: number; monthlyPrice?: number; oneTimePrice?: number; maxStudents?: number }) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          academyName: c.academyName || 'Academia',
          teacherFirstName: c.teacherFirstName,
          teacherLastName: c.teacherLastName,
          videoCount: c.videoCount || 0,
          documentCount: c.documentCount || 0,
          lessonCount: c.lessonCount || 0,
          studentCount: c.studentCount || 0,
          createdAt: c.createdAt,
          startDate: c.startDate,
          enrollmentStatus: c.enrollmentStatus || 'APPROVED',
          documentSigned: c.documentSigned ?? 0,
          whatsappGroupLink: c.whatsappGroupLink,
          paymentStatus: c.paymentStatus || 'PENDING',
          paymentMethod: c.paymentMethod || '',
          monthlyPrice: c.monthlyPrice ?? null,
          oneTimePrice: c.oneTimePrice ?? null,
          maxStudents: c.maxStudents,
        }));
        setEnrolledClasses(classes);
        if (classes.length > 0) {
          setAcademyName(classes[0].academyName);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classItem: EnrolledClass, e: React.MouseEvent) => {
    // First check if document signed
    if (!classItem.documentSigned) {
      e.preventDefault();
      setSigningClass(classItem);
      return;
    }
    
    // Second check payment status - block if not paid (check both PAID and COMPLETED)
    if (classItem.paymentStatus !== 'PAID' && classItem.paymentStatus !== 'COMPLETED') {
      e.preventDefault();
      setPayingClass(classItem);
      return;
    }
    
    // All checks passed - show skeleton loading and navigate to class
    setLoading(true);
    router.push(`/dashboard/student/class/${classItem.slug || classItem.id}`);
  };

  const handleSign = async () => {
    if (!signingClass) return;

    const res = await apiClient('/enrollments/sign-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: signingClass.id }),
    });
    const result = await res.json();

    if (result.success) {
      // Update local state to reflect signed document
      const updatedClass = { ...signingClass, documentSigned: 1 };
      setEnrolledClasses(prev =>
        prev.map(c =>
          c.id === signingClass.id ? updatedClass : c
        )
      );
      setSigningClass(null);
      
      // Check if payment is needed
      if (updatedClass.paymentStatus !== 'PAID') {
        setPayingClass(updatedClass);
      } else {
        // Navigate to the class
        router.push(`/dashboard/student/class/${updatedClass.slug || updatedClass.id}`);
      }
    } else {
      throw new Error(result.error || 'Failed to sign document');
    }
  };

  const hasClasses = enrolledClasses.length > 0;

  if (loading) {
    return <SkeletonClasses />;
  }

  if (!hasClasses) {
    return (
      <div className="max-w-2xl mx-auto mt-8 sm:mt-20">
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-12 text-center">
          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-xl sm:text-2xl font-bold text-gray-900 mb-3">Únete a una Academia</h2>
          <p className="text-gray-600 mb-8">
            Necesitas unirte a una academia e inscribirte en clases para comenzar a aprender.
          </p>
          <Link
            href="/dashboard/student/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Explorar Academias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mis Asignaturas</h1>
          {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
        </div>
        <Link
          href="/dashboard/student/enrolled-academies/classes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Unirse a Más Clases
        </Link>
      </div>

      <div className="space-y-4">
        {enrolledClasses.map((classItem) => {
          const liveStream = activeStreams.find(s => s.classId === classItem.id);
          const needsSignature = !classItem.documentSigned;
          const _isPaymentPending = classItem.paymentStatus === 'PENDING' && (classItem.paymentMethod === 'cash' || classItem.paymentMethod === 'bizum');
          
          return (
            <div
              key={classItem.id}
              data-class-id={classItem.id}
              className="block bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-4 sm:p-6 group cursor-pointer relative"
            >
              <div 
                onClick={(e) => {
                  handleClassClick(classItem, e);
                }}
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-2"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{classItem.name}</h3>
                    {/* Shield Icon - Shows broken shield if unsigned, verified shield if signed */}
                    {needsSignature ? (
                      <div className="relative group/shield">
                        <Image 
                          src="/icons/shield-broken.svg" 
                          alt="Firma requerida" 
                          width={28} 
                          height={28}
                          className="drop-shadow-sm"
                        />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/shield:opacity-100 transition-opacity z-10">
                          Firma requerida
                        </div>
                      </div>
                    ) : (
                      <div className="relative group/shield-signed">
                        <Image 
                          src="/icons/shield-verified.svg" 
                          alt="Documentos firmados" 
                          width={28} 
                          height={28}
                          className="drop-shadow-sm"
                        />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/shield-signed:opacity-100 transition-opacity z-10">
                          Documento firmado
                        </div>
                      </div>
                    )}
                    
                    {/* Enrollment Approval Status - Show only when PENDING */}
                    {classItem.enrollmentStatus === 'PENDING' && (
                      <div className="relative group/approval">
                        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/approval:opacity-100 transition-opacity z-10">
                          Aprobación pendiente
                        </div>
                      </div>
                    )}
                    
                    {/* Payment Status Icon - Show for any non-PAID/non-COMPLETED status */}
                    {classItem.paymentStatus !== 'PAID' && classItem.paymentStatus !== 'COMPLETED' && (
                      (classItem.paymentStatus === 'PENDING' && (classItem.paymentMethod === 'cash' || classItem.paymentMethod === 'bizum')) ? (
                        <div className="relative group/payment">
                          <svg className="w-6 h-6 text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/payment:opacity-100 transition-opacity z-10">
                            {classItem.paymentMethod === 'cash' ? 'Esperando aprobación de la academia (efectivo)' : 'Esperando aprobación de la academia (bizum)'}
                          </div>
                        </div>
                      ) : (
                        <div className="relative group/payment">
                          <svg className="w-6 h-6 text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/payment:opacity-100 transition-opacity z-10">
                            Pago requerido
                          </div>
                        </div>
                      )
                    )}
                    
                    {/* WhatsApp Group Link - Low-key icon */}
                    {classItem.whatsappGroupLink && (
                      <a
                        href={classItem.whatsappGroupLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="relative group/whatsapp"
                      >
                        <svg className="w-6 h-6 text-green-500 hover:text-green-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/whatsapp:opacity-100 transition-opacity z-10">
                          Grupo WhatsApp
                        </div>
                      </a>
                    )}
                      {liveStream && (
                        <span className="flex items-center gap-1.5 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold border border-red-200">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          EN VIVO
                        </span>
                      )}
                    </div>
                    
                    {/* Abandonar Clase Button - Right side of header */}
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
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium text-sm border border-red-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Abandonar Clase
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
                  
                  {/* Date only */}
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
        })}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!payingClass}
        onClose={() => setPayingClass(null)}
        classId={payingClass?.id || ''}
        className={payingClass?.name || ''}
        academyName={payingClass?.academyName || ''}
        currentPaymentStatus={payingClass?.paymentStatus || 'PENDING'}
        currentPaymentMethod={payingClass?.paymentMethod || ''}
        monthlyPrice={payingClass?.monthlyPrice ?? null}
        oneTimePrice={payingClass?.oneTimePrice ?? null}
        maxStudents={payingClass?.maxStudents}
        currentStudentCount={payingClass?.studentCount || 0}
        onPaymentComplete={() => {
          setPayingClass(null);
          loadData();
        }}
      />

      {/* Document Signing Modal */}
      <DocumentSigningModal
        isOpen={!!signingClass}
        onClose={() => setSigningClass(null)}
        onSign={handleSign}
        classId={signingClass?.id || ''}
        className={signingClass?.name || ''}
      />
    </div>
  );
}
