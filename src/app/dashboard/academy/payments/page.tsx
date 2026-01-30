'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoPendingPayments, generateDemoPaymentHistory } from '@/lib/demo-data';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { StudentPaymentDetailModal } from '@/components/shared';

interface PendingPayment {
  enrollmentId: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentAmount: number;
  currency: string;
  enrolledAt: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  classId: string;
  className: string;
  academyId: string;
  academyName: string;
  teacherName?: string;
}

interface PaymentHistory {
  enrollmentId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  className: string;
  classId: string;
  paymentAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  approvedByName?: string;
  approvedAt: string;
  teacherName?: string;
}

export default function AcademyPaymentsPage() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [reversingIds, setReversingIds] = useState<Set<string>>(new Set());
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: string;
    name: string;
    email: string;
    className: string;
    enrollmentDate: string;
    paymentData?: any;
  } | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    studentId: '',
    classId: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'bizum',
  });
  const [students, setStudents] = useState<{id: string; firstName: string; lastName: string; email: string}[]>([]);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const showStudentPaymentHistory = async (studentId: string, studentName: string, studentEmail: string, className: string, enrollmentDate: string, classId: string) => {
    try {
      const url = `/student-payments/${studentId}/class/${classId}`;
      console.log('Fetching payment history from:', url);
      // Fetch real payment history from API
      const res = await apiClient(url);
      
      // Check if response is OK before parsing JSON
      if (!res.ok) {
        console.error(`API returned ${res.status}: ${res.statusText} for URL: ${url}`);
        const text = await res.text();
        console.error('Response body:', text);
        // Still open modal even if fetch fails, will show empty state
        setSelectedStudent({
          studentId,
          name: studentName,
          email: studentEmail,
          className,
          enrollmentDate,
          paymentData: null,
        });
        return;
      }
      
      // Check if response has content before parsing
      const text = await res.text();
      if (!text || text.trim() === '') {
        console.error('Empty response from API');
        setSelectedStudent({
          studentId,
          name: studentName,
          email: studentEmail,
          className,
          enrollmentDate,
          paymentData: null,
        });
        return;
      }
      
      const result = JSON.parse(text);
      
      if (result.success && result.data) {
        setSelectedStudent({
          studentId,
          name: studentName,
          email: studentEmail,
          className,
          enrollmentDate,
          paymentData: result.data, // Include the fetched payment data
        });
      } else {
        console.error('Failed to fetch payment history:', result.error);
        // Still open modal even if fetch fails, will show empty state
        setSelectedStudent({
          studentId,
          name: studentName,
          email: studentEmail,
          className,
          enrollmentDate,
          paymentData: null,
        });
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      // Still open modal on error, will show empty state
      setSelectedStudent({
        studentId,
        name: studentName,
        email: studentEmail,
        className,
        enrollmentDate,
        paymentData: null,
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Check academy payment status first
      const academyRes = await apiClient('/academies');
      const academyResult = await academyRes.json();
      
      if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
        const academy = academyResult.data[0];
        const status = academy.paymentStatus || 'PAID';
        setPaymentStatus(status);
        
        // If NOT PAID, show demo payments
        if (status === 'NOT PAID') {
          const demoPending = generateDemoPendingPayments();
          const demoHistory = generateDemoPaymentHistory();
          setPendingPayments(demoPending as any[]);
          setPaymentHistory(demoHistory as any[]);
          setClasses([
            { id: 'demo-c1', name: 'Programación Web' },
            { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
            { id: 'demo-c3', name: 'Diseño Gráfico' },
            { id: 'demo-c4', name: 'Física Cuántica' },
          ]);
          setLoading(false);
          return;
        }
      }
      
      // If PAID, load real payments
      const [pendingRes, historyRes, classesRes, studentsRes] = await Promise.all([
        apiClient('/payments/pending-cash'),
        apiClient('/payments/history'),
        apiClient('/academies/classes'),
        apiClient('/academies/students'),
      ]);

      const [pendingResult, historyResult, classesResult, studentsResult] = await Promise.all([
        pendingRes.json(),
        historyRes.json(),
        classesRes.json(),
        studentsRes.json(),
      ]);

      if (pendingResult.success) {
        setPendingPayments(pendingResult.data || []);
      }

      if (historyResult.success) {
        setPaymentHistory(historyResult.data || []);
      }
      
      if (classesResult.success && Array.isArray(classesResult.data)) {
        setClasses(classesResult.data);
      }

      if (studentsResult.success && Array.isArray(studentsResult.data)) {
        setStudents(studentsResult.data);
      }
    } catch (error) {
      console.error('Failed to load payments data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId: string) => {
    setProcessingIds(prev => new Set(prev).add(enrollmentId));
    try {
      const res = await apiClient(`/payments/${enrollmentId}/approve-cash`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });

      const result = await res.json();
      if (result.success) {
        setPendingPayments(prev => prev.filter(p => p.enrollmentId !== enrollmentId));
        loadData(); // Reload to update history
      } else {
        alert(result.error || 'Error al confirmar pago');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleReject = async (enrollmentId: string) => {
    if (!confirm('¿Denegar este pago? Se eliminará permanentemente.')) return;
    
    setProcessingIds(prev => new Set(prev).add(enrollmentId));
    try {
      const res = await apiClient(`/payments/${enrollmentId}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (result.success) {
        setPendingPayments(prev => prev.filter(p => p.enrollmentId !== enrollmentId));
      } else {
        alert(result.error || 'Error al denegar pago');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleReversePayment = async (enrollmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PAID' ? 'denegado' : 'confirmado';
    if (!confirm(`¿Estás seguro de revertir este estado a ${newStatus}?`)) {
      return;
    }

    setReversingIds(prev => new Set(prev).add(enrollmentId));
    try {
      const response = await apiClient(`/payments/history/${enrollmentId}/reverse`, {
        method: 'PUT',
      });

      const result = await response.json();
      if (result.success) {
        loadData(); // Reload to update history
      } else {
        alert(result.error || 'Failed to reverse payment status');
      }
    } catch (error) {
      console.error('Error reversing payment status:', error);
      alert('An error occurred');
    } finally {
      setReversingIds(prev => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const handleRegisterPayment = async () => {
    if (!registerForm.studentId || !registerForm.classId || !registerForm.amount) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const res = await apiClient('/payments/register-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: registerForm.studentId,
          classId: registerForm.classId,
          amount: parseFloat(registerForm.amount),
          paymentMethod: registerForm.paymentMethod,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setShowRegisterModal(false);
        setRegisterForm({ studentId: '', classId: '', amount: '', paymentMethod: 'cash' });
        loadData();
      } else {
        alert(result.error || 'Error al registrar pago');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('¿Eliminar este pago permanentemente?')) return;
    
    setDeletingPaymentId(paymentId);
    try {
      const res = await apiClient(`/payments/${paymentId}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (result.success) {
        loadData();
      } else {
        alert(result.error || 'Error al eliminar pago');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setDeletingPaymentId(null);
    }
  };
  
  const filteredPendingPayments = pendingPayments.filter(p => {
    const matchesSearch = searchQuery === '' || 
      `${p.studentFirstName} ${p.studentLastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || p.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const filteredPaymentHistory = paymentHistory.filter(p => {
    const matchesSearch = searchQuery === '' || 
      `${p.studentFirstName} ${p.studentLastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || p.className === classes.find(c => c.id === selectedClass)?.name;
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return <SkeletonTable rows={10} cols={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters - matching students page layout */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pagos Pendientes</h1>
          <p className="text-gray-600 text-sm mt-1">
            Revisa y confirma los pagos en efectivo de los estudiantes
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {/* Class Filter */}
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none w-48 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">Todas las clases</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Pending Payments List */}
      {filteredPendingPayments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pagos pendientes</h3>
          <p className="text-gray-500">{searchQuery || selectedClass !== 'all' ? 'No se encontraron pagos con los filtros aplicados' : 'Los pagos en efectivo aparecerán aquí cuando los estudiantes los registren'}</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          {filteredPendingPayments.map((payment) => (
            <div key={payment.enrollmentId} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="w-56">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {payment.studentFirstName} {payment.studentLastName}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{payment.studentEmail}</p>
                    </div>
                    <div className="border-l border-gray-200 pl-8">
                      <div className="flex items-center gap-2 text-sm mb-0.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-gray-900 font-medium">{payment.className}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Registrado {new Date(payment.enrolledAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="border-l border-gray-200 pl-8">
                      <div className="flex items-center gap-2 text-sm mb-0.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-semibold">{formatCurrency(payment.paymentAmount, payment.currency)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="capitalize">{payment.paymentMethod === 'CASH' ? 'Efectivo' : payment.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => showStudentPaymentHistory(
                      payment.studentId,
                      `${payment.studentFirstName} ${payment.studentLastName}`,
                      payment.studentEmail,
                      payment.className,
                      payment.enrolledAt,
                      payment.classId
                    )}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Ver historial
                  </button>
                  <button
                    onClick={() => handleReject(payment.enrollmentId)}
                    disabled={processingIds.has(payment.enrollmentId) || paymentStatus === 'NOT PAID'}
                    className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingIds.has(payment.enrollmentId) ? 'Procesando...' : 'Denegar'}
                  </button>
                  <button
                    onClick={() => handleApprove(payment.enrollmentId)}
                    disabled={processingIds.has(payment.enrollmentId) || paymentStatus === 'NOT PAID'}
                    className="px-5 py-2.5 bg-accent-300 text-gray-900 border-2 border-accent-300 rounded-lg hover:bg-accent-400 hover:border-accent-400 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingIds.has(payment.enrollmentId) ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment History Table */}
      {paymentHistory.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Historial de Pagos</h2>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="ml-3 px-4 py-2 bg-accent-300 text-gray-900 border-2 border-accent-300 rounded-lg hover:bg-accent-400 hover:border-accent-400 font-medium text-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar Pago
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clase</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">METODO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aprobado por</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACCION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPaymentHistory.map((history, index) => (
                  <tr key={`${history.enrollmentId}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {history.studentFirstName} {history.studentLastName}
                        </div>
                        <div className="text-sm text-gray-500">{history.studentEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{history.className}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{history.teacherName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(history.paymentAmount, history.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 capitalize">{history.paymentMethod === 'CASH' ? 'Efectivo' : history.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{history.approvedByName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(history.approvedAt).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => showStudentPaymentHistory(
                          (history as any).studentId || '',
                          `${history.studentFirstName} ${history.studentLastName}`,
                          history.studentEmail,
                          history.className,
                          history.approvedAt,
                          history.classId
                        )}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Ver historial
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Payment Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar Pago</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante *</label>
                <div className="relative">
                  <input
                    type="text"
                    list="students-list"
                    value={students.find(s => s.id === registerForm.studentId) ? `${students.find(s => s.id === registerForm.studentId)!.firstName} ${students.find(s => s.id === registerForm.studentId)!.lastName}` : ''}
                    onChange={(e) => {
                      const student = students.find(s => `${s.firstName} ${s.lastName}` === e.target.value);
                      setRegisterForm({ ...registerForm, studentId: student?.id || '' });
                    }}
                    placeholder="Buscar estudiante..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <datalist id="students-list">
                    {students.map(s => (
                      <option key={s.id} value={`${s.firstName} ${s.lastName}`}>{s.email}</option>
                    ))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clase *</label>
                <div className="relative">
                  <select
                    value={registerForm.classId}
                    onChange={(e) => setRegisterForm({ ...registerForm, classId: e.target.value })}
                    className="w-full appearance-none px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  >
                    <option value="">Seleccionar clase...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  value={registerForm.amount}
                  onChange={(e) => setRegisterForm({ ...registerForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago *</label>
                <div className="relative">
                  <select
                    value={registerForm.paymentMethod}
                    onChange={(e) => setRegisterForm({ ...registerForm, paymentMethod: e.target.value as 'cash' | 'bizum' })}
                    className="w-full appearance-none px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="bizum">Bizum</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterPayment}
                className="flex-1 px-4 py-2 bg-accent-300 text-gray-900 rounded-lg hover:bg-accent-400"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Payment Detail Modal */}
      {selectedStudent && (
        <StudentPaymentDetailModal
          isOpen={selectedStudent !== null}
          onClose={() => setSelectedStudent(null)}
          studentName={selectedStudent.name}
          studentEmail={selectedStudent.email}
          className={selectedStudent.className}
          payments={selectedStudent.paymentData?.payments || []}
          totalPaid={selectedStudent.paymentData?.totalPaid || 0}
          totalDue={selectedStudent.paymentData?.totalDue || 0}
          paymentFrequency={selectedStudent.paymentData?.paymentFrequency || 'ONE_TIME'}
          enrollmentDate={selectedStudent.paymentData?.enrollmentDate || selectedStudent.enrollmentDate}
        />
      )}
    </div>
  );
}
