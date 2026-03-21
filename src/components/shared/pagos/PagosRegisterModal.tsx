'use client';

import { ModalPortal } from '@/components/ui/ModalPortal';
import { StyledSelect } from '@/components/ui/StyledSelect';
import type { PagosState } from './usePagosData';
import type { PagosActions } from './usePagosActions';

interface PagosRegisterModalProps {
  state: PagosState;
  actions: PagosActions;
}

export function PagosRegisterModal({ state, actions }: PagosRegisterModalProps) {
  const {
    paymentStatus, editingPaymentId, registerForm, setRegisterForm,
    students, studentSearchTerm, setStudentSearchTerm,
    showStudentDropdown, setShowStudentDropdown,
    studentEnrollments, setShowRegisterModal, setEditingPaymentId,
  } = state;
  const { handleRegisterPayment } = actions;

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[9999] overflow-y-auto py-8 px-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 my-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingPaymentId ? 'Editar Pago' : 'Registrar Pago'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
              <div className="relative">
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => { setStudentSearchTerm(e.target.value); setShowStudentDropdown(true); }}
                  onFocus={() => setShowStudentDropdown(true)}
                  placeholder="Buscar estudiante..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {showStudentDropdown && studentSearchTerm.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Clase</label>
              <StyledSelect
                value={registerForm.classId}
                onChange={(v) => setRegisterForm({ ...registerForm, classId: v })}
                options={[
                  { value: '', label: registerForm.studentId ? 'Seleccionar clase...' : 'Primero selecciona un estudiante' },
                  ...(registerForm.studentId ? (studentEnrollments[registerForm.studentId] || []).map(e => ({ value: e.classId, label: e.className })) : []),
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <button
                  type="button"
                  onClick={() => setRegisterForm({ ...registerForm, status: registerForm.status === 'PAID' ? 'PENDING' : 'PAID' })}
                  className="w-full relative h-[42px] rounded-lg overflow-hidden border-2 border-gray-200 transition-all hover:border-gray-300"
                >
                  <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${registerForm.status === 'PAID' ? 'translate-x-0' : 'translate-x-1/2'}`}>
                    <div className="w-1/2 h-full bg-gray-900"></div>
                  </div>
                  <div className="relative flex h-full">
                    <div className="flex-1 flex items-center justify-center">
                      <span className={`text-sm font-semibold transition-colors ${registerForm.status === 'PAID' ? 'text-white' : 'text-gray-600'}`}>Pagado</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className={`text-sm font-semibold transition-colors ${registerForm.status === 'PENDING' ? 'text-white' : 'text-gray-600'}`}>Por Pagar</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
              <StyledSelect
                value={registerForm.paymentMethod}
                onChange={(v) => setRegisterForm({ ...registerForm, paymentMethod: v as 'cash' | 'transferencia' })}
                options={[
                  { value: 'cash', label: 'Efectivo' },
                  { value: 'transferencia', label: 'Transferencia' },
                ]}
              />
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
              disabled={paymentStatus === 'NOT PAID'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed"
              title={paymentStatus === 'NOT PAID' ? 'Disponible solo en academias activadas' : 'Registrar pago'}
            >
              Registrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
