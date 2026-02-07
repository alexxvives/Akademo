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
  paymentId?: string;
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
  const [academyName, setAcademyName] = useState<string>('');
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
    classId?: string;
  } | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({
    studentId: '',
    classId: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'bizum',
    status: 'PAID' as 'PAID' | 'PENDING',
  });
  const [students, setStudents] = useState<{id: string; firstName: string; lastName: string; email: string}[]>([]);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [studentEnrollments, setStudentEnrollments] = useState<{[key: string]: {classId: string; className: string}[]}>({});

  const showStudentPaymentHistory = async (studentId: string, studentName: string, studentEmail: string, className: string, enrollmentDate: string, classId: string) => {
    try {
      const url = `/student-payments/${studentId}/class/${classId}`;
      // Fetch real payment history from API
      const res = await apiClient(url);
      
      // Check if response is OK before parsing JSON
      if (!res.ok) {
        console.error(`Failed to fetch payment history: ${res.status}`);
        // Still open modal even if fetch fails, will show empty state
        setSelectedStudent({
          studentId,
          name: studentName,
          email: studentEmail,
          className,
          enrollmentDate,
          paymentData: null,
          classId,
        });
        return;
      }
      
      // Parse JSON directly - don't consume the body twice!
      const result = await res.json();
      
      if (result.success && result.data) {
        setSelectedStudent({
          studentId,
          name: studentName,
          email: studentEmail,
          className,
          enrollmentDate,
          paymentData: { ...result.data, classId }, // Add classId to track current class
          classId,
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
          classId,
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
        classId,
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
        setAcademyName(academy.name);
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
        
        // Build enrollment map for filtering classes (deduplicated by classId)
        const enrollmentMap: {[key: string]: {classId: string; className: string}[]} = {};
        const addToEnrollmentMap = (studentId: string, classId: string, className: string) => {
          if (!enrollmentMap[studentId]) {
            enrollmentMap[studentId] = [];
          }
          // Check if class already exists to avoid duplicates
          const exists = enrollmentMap[studentId].some(e => e.classId === classId);
          if (!exists) {
            enrollmentMap[studentId].push({ classId, className });
          }
        };
        
        if (pendingResult.success && Array.isArray(pendingResult.data)) {
          pendingResult.data.forEach((p: any) => {
            addToEnrollmentMap(p.studentId, p.classId, p.className);
          });
        }
        if (historyResult.success && Array.isArray(historyResult.data)) {
          historyResult.data.forEach((p: any) => {
            addToEnrollmentMap(p.studentId, p.classId, p.className);
          });
        }
        setStudentEnrollments(enrollmentMap);
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
      // All payments are now in Payment table - use approve-payment endpoint
      const res = await apiClient(`/payments/${enrollmentId}/approve-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });

      const result = await res.json();
      if (result.success) {
        setPendingPayments(prev => prev.filter(p => p.enrollmentId !== enrollmentId));
        loadData(); // Reload to update history
        // Trigger badge update by dispatching custom event
        window.dispatchEvent(new CustomEvent('pendingPaymentsChanged'));
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
        // Trigger badge update by dispatching custom event
        window.dispatchEvent(new CustomEvent('pendingPaymentsChanged'));
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
      const isEditing = editingPaymentId !== null;
      const endpoint = isEditing ? `/payments/${editingPaymentId}` : '/payments/register-manual';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await apiClient(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: registerForm.studentId,
          classId: registerForm.classId,
          amount: parseFloat(registerForm.amount),
          paymentMethod: registerForm.paymentMethod,
          status: registerForm.status,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('API error:', text);
        alert(`Error al registrar pago: ${res.status} ${res.statusText}`);
        return;
      }

      const text = await res.text();
      if (!text || text.trim() === '') {
        console.error('Empty response from API');
        alert('Error: El servidor no respondió correctamente');
        return;
      }

      const result = JSON.parse(text);
      if (result.success) {
        setShowRegisterModal(false);
        setEditingPaymentId(null);
        setRegisterForm({ studentId: '', classId: '', amount: '', paymentMethod: 'cash', status: 'PAID' });
        setStudentSearchTerm('');
        // Reload data to show updated payment
        await loadData();
        setShowStudentDropdown(false);
        loadData();
      } else {
        alert(result.error || 'Error al registrar pago');
      }
    } catch (error: any) {
      console.error('Error registering payment:', error);
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
    <div className="space-y-6 pb-8">
      {/* Header with Register Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">Gestión de Pagos</h1>
            <button
              onClick={() => {
                setEditingPaymentId(null);
                setRegisterForm({ studentId: '', classId: '', amount: '', paymentMethod: 'cash', status: 'PAID' });
                setStudentSearchTerm('');
                setShowRegisterModal(true);
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar Pago
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            {academyName || 'Cargando...'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
              className="appearance-none w-full sm:w-48 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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

      {/* Unified Payments Table with hover hint */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <div className="px-3 sm:px-3 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-gray-600">
              Haz clic en cualquier fila para editar.
            </span>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 sm:px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-3 sm:px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
              <th className="px-3 sm:px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clase</th>
              <th className="px-3 sm:px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-3 sm:px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
              <th className="px-3 sm:px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-3 sm:px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Historial</th>
              <th className="px-3 sm:px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Pending Payments First (highlighted) */}
            {filteredPendingPayments.map((payment) => (
              <tr
                key={`pending-${payment.enrollmentId}`}
                className="bg-amber-50 hover:bg-amber-100 border-l-4 border-amber-400 transition-colors"
              >
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Pendiente
                  </span>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {payment.studentFirstName} {payment.studentLastName}
                    </div>
                    <div className="text-sm text-gray-500">{payment.studentEmail}</div>
                  </div>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4">
                  <div className="text-sm text-gray-900">{payment.className}</div>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.paymentAmount, payment.currency)}
                  </div>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700 capitalize">
                    {payment.paymentMethod?.toUpperCase() === 'CASH' ? 'Efectivo' : payment.paymentMethod}
                  </div>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payment.enrolledAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showStudentPaymentHistory(
                        payment.studentId,
                        `${payment.studentFirstName} ${payment.studentLastName}`,
                        payment.studentEmail,
                        'Todas las clases',
                        payment.enrolledAt,
                        'all'
                      );
                    }}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ver
                  </button>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(payment.enrollmentId);
                      }}
                      disabled={processingIds.has(payment.enrollmentId)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium disabled:opacity-50"
                      title="Denegar pago"
                    >
                      ✕
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(payment.enrollmentId);
                      }}
                      disabled={processingIds.has(payment.enrollmentId)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium disabled:opacity-50"
                      title="Aprobar pago"
                    >
                      {processingIds.has(payment.enrollmentId) ? '...' : '✓ Aprobar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Paid Payments (editable on click) */}
            {filteredPaymentHistory.map((history, index) => (
              <tr
                key={`history-${history.enrollmentId}-${index}`}
                onClick={() => {
                  setRegisterForm({
                    studentId: (history as any).studentId || '',
                    classId: history.classId || '',
                    amount: history.paymentAmount.toString(),
                    paymentMethod: (history.paymentMethod.toLowerCase() === 'cash' || history.paymentMethod === 'CASH') ? 'cash' : 'bizum',
                    status: 'PAID',
                  });
                  setEditingPaymentId(history.paymentId || null);
                  setShowRegisterModal(true);
                }}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Pagado
                  </span>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {history.studentFirstName} {history.studentLastName}
                    </div>
                    <div className="text-sm text-gray-500">{history.studentEmail}</div>
                  </div>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4">
                  <div className="text-sm text-gray-900">{history.className}</div>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(history.paymentAmount, history.currency)}
                  </div>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700 capitalize">
                    {history.paymentMethod.toLowerCase() === 'cash' || history.paymentMethod === 'CASH'
                      ? 'Efectivo'
                      : history.paymentMethod.toLowerCase() === 'bizum' || history.paymentMethod === 'BIZUM'
                      ? 'Bizum'
                      : history.paymentMethod.toLowerCase() === 'stripe' || history.paymentMethod === 'STRIPE'
                      ? 'Stripe'
                      : history.paymentMethod}
                  </div>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(history.approvedAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showStudentPaymentHistory(
                        (history as any).studentId || '',
                        `${history.studentFirstName} ${history.studentLastName}`,
                        history.studentEmail,
                        'Todas las clases',
                        history.approvedAt,
                        'all'
                      );
                    }}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ver
                  </button>
                </td>
                <td className="px-3 sm:px-3 sm:px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm('¿Estás seguro de que quieres eliminar este pago? Esta acción no se puede deshacer.')) return;
                      
                      try {
                        setDeletingPaymentId(history.paymentId || null);
                        const response = await apiClient(`/payments/${history.paymentId}`, {
                          method: 'DELETE',
                        });
                        
                        if (response.ok) {
                          // Refresh payments list
                          const url = `/payments/pending-cash?academyId=${window.location.pathname.includes('academy') ? 'current' : ''}`;
                          const pendingRes = await apiClient(url);
                          if (pendingRes.ok) {
                            const pendingData = await pendingRes.json();
                            setPendingPayments(pendingData.data || []);
                          }
                          
                          const historyRes = await apiClient('/payments/history');
                          if (historyRes.ok) {
                            const historyData = await historyRes.json();
                            setPaymentHistory(historyData.data || []);
                          }
                        } else {
                          alert('Error al eliminar el pago');
                        }
                      } catch (error) {
                        console.error('Error deleting payment:', error);
                        alert('Error al eliminar el pago');
                      } finally {
                        setDeletingPaymentId(null);
                      }
                    }}
                    disabled={deletingPaymentId === history.paymentId}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {deletingPaymentId === history.paymentId ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                      Eliminar
                    </button>
                </td>
              </tr>
            ))}

            {/* Empty State */}
            {filteredPendingPayments.length === 0 && filteredPaymentHistory.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 sm:py-8 sm:py-12 text-center">
                  <div className="text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pagos</h3>
                    <p className="text-gray-500">
                      {searchQuery || selectedClass !== 'all'
                        ? 'No se encontraron pagos con los filtros aplicados'
                        : 'Los pagos aparecerán aquí cuando se registren'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Remove the old separate Payment History section - now integrated above */}

      {/* Register Payment Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[9999] overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 my-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPaymentId ? 'Editar Pago' : 'Registrar Pago'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => {
                      setStudentSearchTerm(e.target.value);
                      setShowStudentDropdown(true);
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    placeholder="Buscar estudiante..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {showStudentDropdown && studentSearchTerm.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {students
                        .filter(s => 
                          `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
                        )
                        .map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setRegisterForm({ ...registerForm, studentId: s.id });
                              setStudentSearchTerm(`${s.firstName} ${s.lastName}`);
                              setShowStudentDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex flex-col"
                          >
                            <span className="font-medium">{s.firstName} {s.lastName}</span>
                            <span className="text-sm text-gray-500">{s.email}</span>
                          </button>
                        ))}
                      {students.filter(s => 
                        `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        s.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-2 text-gray-500">No se encontraron estudiantes</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clase *</label>
                <div className="relative">
                  <select
                    value={registerForm.classId}
                    onChange={(e) => setRegisterForm({ ...registerForm, classId: e.target.value })}
                    className="w-full appearance-none px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    disabled={!registerForm.studentId}
                  >
                    <option value="">{registerForm.studentId ? 'Seleccionar clase...' : 'Primero selecciona un estudiante'}</option>
                    {registerForm.studentId && studentEnrollments[registerForm.studentId]?.map(e => (
                      <option key={e.classId} value={e.classId}>{e.className}</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                <button
                  type="button"
                  onClick={() => setRegisterForm({ ...registerForm, status: registerForm.status === 'PAID' ? 'PENDING' : 'PAID' })}
                  className="w-full relative h-12 rounded-lg overflow-hidden border-2 border-gray-200 transition-all hover:border-gray-300"
                >
                  {/* Sliding background */}
                  <div
                    className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                      registerForm.status === 'PAID' ? 'translate-x-0' : 'translate-x-1/2'
                    }`}
                  >
                    <div className="w-1/2 h-full bg-gray-900"></div>
                  </div>
                  
                  {/* Labels */}
                  <div className="relative z-10 flex h-full">
                    <div className="flex-1 flex items-center justify-center">
                      <span className={`font-semibold transition-colors ${
                        registerForm.status === 'PAID' ? 'text-white' : 'text-gray-600'
                      }`}>
                        Pagado
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className={`font-semibold transition-colors ${
                        registerForm.status === 'PENDING' ? 'text-white' : 'text-gray-600'
                      }`}>
                        Por Pagar
                      </span>
                    </div>
                  </div>
                </button>
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
                onClick={() => {
                  setShowRegisterModal(false);
                  setEditingPaymentId(null);
                  setStudentSearchTerm('');
                  setShowStudentDropdown(false);
                  setRegisterForm({ studentId: '', classId: '', amount: '', paymentMethod: 'cash', status: 'PAID' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterPayment}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
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
          availableClasses={(studentEnrollments[selectedStudent.studentId] || []).map(e => ({
            id: e.classId,
            name: e.className
          }))}
          currentClassId="all"
          onClassChange={async (classId) => {
            if (classId === 'all') {
              // Show all payments across all classes
              await showStudentPaymentHistory(
                selectedStudent.studentId,
                selectedStudent.name,
                selectedStudent.email,
                'Todas las clases',
                selectedStudent.enrollmentDate,
                classId
              );
            } else {
              const selectedClass = studentEnrollments[selectedStudent.studentId]?.find(c => c.classId === classId);
              if (selectedClass) {
                await showStudentPaymentHistory(
                  selectedStudent.studentId,
                  selectedStudent.name,
                  selectedStudent.email,
                  selectedClass.className,
                  selectedStudent.enrollmentDate,
                  classId
                );
              }
            }
          }}
        />
      )}
    </div>
  );
}
