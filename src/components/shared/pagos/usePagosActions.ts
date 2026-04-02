'use client';

import { apiClient } from '@/lib/api-client';
import { generateDemoPendingPayments, generateDemoPaymentHistory } from '@/lib/demo-data';
import type { PaymentHistory, PaymentHistoryResponse, SelectedStudent, DemoPendingPayment, DemoHistoryPayment } from './pagos-types';
import type { PagosState } from './usePagosData';

export function usePagosActions(state: PagosState) {
  const {
    isAdmin, isAcademy, paymentStatus,
    setProcessingIds, setPendingPayments, loadData,
    setSelectedStudent,
    setShowRegisterModal, setEditingPaymentId,
    setRegisterForm, setStudentSearchTerm, setShowStudentDropdown,
    setDeletingPaymentId, setReversingPaymentId,
    registerForm, editingPaymentId,
  } = state;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const showStudentPaymentHistory = async (
    studentId: string, studentName: string, studentEmail: string,
    className: string, enrollmentDate: string, classId: string,
  ) => {
    const makeStudent = (paymentData: PaymentHistoryResponse | null): SelectedStudent => ({
      studentId, name: studentName, email: studentEmail, className, enrollmentDate, paymentData, classId,
    });

    try {
      if (isAcademy && paymentStatus === 'NOT PAID') {
        const demoHistory: DemoHistoryPayment[] = generateDemoPaymentHistory();
        const demoPending: DemoPendingPayment[] = generateDemoPendingPayments();
        const studentHistoryPayments = demoHistory.filter(p =>
          p.studentEmail === studentEmail && (classId === 'all' || p.classId === classId)
        );
        const studentPendingPayments = demoPending.filter(p =>
          p.studentEmail === studentEmail && (classId === 'all' || p.classId === classId)
        );
        const allStudentPayments = [
          ...studentPendingPayments.map(p => ({ ...p, paymentStatus: p.paymentStatus })),
          ...studentHistoryPayments,
        ];
        if (allStudentPayments.length > 0) {
          const totalPaid = allStudentPayments
            .filter(p => p.paymentStatus === 'PAID')
            .reduce((sum, p) => sum + p.paymentAmount, 0);
          const totalDue = allStudentPayments
            .filter(p => p.paymentStatus === 'CASH_PENDING' || p.paymentStatus === 'PENDING')
            .reduce((sum, p) => sum + p.paymentAmount, 0);
          setSelectedStudent(makeStudent({
            payments: allStudentPayments.map(p => ({
              id: p.enrollmentId, amount: p.paymentAmount, currency: p.currency,
              paymentMethod: p.paymentMethod, status: p.paymentStatus,
              paymentDate: p.createdAt, dueDate: p.createdAt, className: p.className,
            })),
            totalPaid, totalDue, paymentFrequency: 'MONTHLY', enrollmentDate, classId,
          }));
        } else {
          setSelectedStudent(makeStudent(null));
        }
        return;
      }

      const url = `/student-payments/${studentId}/class/${classId}`;
      const res = await apiClient(url);
      if (!res.ok) {
        console.error(`Failed to fetch payment history: ${res.status}`);
        setSelectedStudent(makeStudent(null));
        return;
      }
      const result = await res.json();
      if (result.success && result.data) {
        setSelectedStudent(makeStudent({ ...result.data, classId }));
      } else {
        setSelectedStudent(makeStudent(null));
      }
    } catch (error: unknown) {
      console.error('Error fetching payment history:', error);
      setSelectedStudent(makeStudent(null));
    }
  };

  const handleApprove = async (enrollmentId: string) => {
    if (isAdmin) return;
    setProcessingIds(prev => new Set(prev).add(enrollmentId));
    try {
      const res = await apiClient(`/payments/${enrollmentId}/approve-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      const result = await res.json();
      if (result.success) {
        await loadData();
        setPendingPayments(prev => prev.filter(p => p.enrollmentId !== enrollmentId));
        window.dispatchEvent(new CustomEvent('pendingPaymentsChanged'));
      } else {
        alert(result.error || 'Error al confirmar pago');
      }
    } catch (error: unknown) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleRegisterPayment = async () => {
    if (isAdmin) return;
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
        alert('Error: El servidor no respondió correctamente');
        return;
      }
      const result = JSON.parse(text);
      if (result.success) {
        setShowRegisterModal(false);
        setEditingPaymentId(null);
        setRegisterForm({ studentId: '', classId: '', amount: '', paymentMethod: 'cash', status: 'PAID' });
        setStudentSearchTerm('');
        await loadData();
        setShowStudentDropdown(false);
      } else {
        alert(result.error || 'Error al registrar pago');
      }
    } catch (error: unknown) {
      console.error('Error registering payment:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleEditPayment = (history: PaymentHistory) => {
    setRegisterForm({
      studentId: history.studentId || '',
      classId: history.classId || '',
      amount: history.paymentAmount.toString(),
      paymentMethod: (history.paymentMethod.toLowerCase() === 'cash' || history.paymentMethod === 'CASH') ? 'cash' : 'transferencia',
      status: 'PAID',
    });
    setEditingPaymentId(history.paymentId || null);
    setShowRegisterModal(true);
  };

  const handleReversePayment = async (paymentId: string | undefined) => {
    if (!confirm('¿Quieres cancelar este pago y devolverlo a pendiente?')) return;
    try {
      setReversingPaymentId(paymentId || null);
      const response = await apiClient(`/payments/history/${paymentId}/reverse`, { method: 'PUT' });
      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json().catch(() => ({}));
        alert((data as { message?: string }).message || 'Error al cancelar el pago');
      }
    } catch (error) {
      console.error('Error reversing payment:', error);
      alert('Error al cancelar el pago');
    } finally {
      setReversingPaymentId(null);
    }
  };

  const handleApproveAll = async (enrollmentIds: string[]) => {
    if (isAdmin || enrollmentIds.length === 0) return;
    const idSet = new Set(enrollmentIds);
    setProcessingIds(prev => new Set([...Array.from(prev), ...enrollmentIds]));
    try {
      const results = await Promise.all(
        enrollmentIds.map(id =>
          apiClient(`/payments/${id}/approve-payment`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved: true }),
          }).then(r => r.json()).catch(() => ({ success: false }))
        )
      );
      const failed = results.filter(r => !r.success).length;
      if (failed > 0) alert(`${failed} pago(s) no se pudieron confirmar`);
      await loadData();
      setPendingPayments(prev => prev.filter(p => !idSet.has(p.enrollmentId)));
      window.dispatchEvent(new CustomEvent('pendingPaymentsChanged'));
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        enrollmentIds.forEach(id => next.delete(id));
        return next;
      });
    }
  };

  const handleDeletePayment = async (paymentId: string | undefined) => {
    if (paymentStatus === 'NOT PAID') return;
    if (!confirm('¿Estás seguro de que quieres eliminar este pago? Esta acción no se puede deshacer.')) return;
    try {
      setDeletingPaymentId(paymentId || null);
      const response = await apiClient(`/payments/${paymentId}`, { method: 'DELETE' });
      if (response.ok) {
        await loadData();
      } else {
        alert('Error al eliminar el pago');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Error al eliminar el pago');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  return {
    formatCurrency,
    showStudentPaymentHistory,
    handleApprove,
    handleApproveAll,
    handleRegisterPayment,
    handleEditPayment,
    handleReversePayment,
    handleDeletePayment,
  };
}

export type PagosActions = ReturnType<typeof usePagosActions>;
