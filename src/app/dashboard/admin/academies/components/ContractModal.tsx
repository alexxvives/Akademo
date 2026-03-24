'use client';

import { createPortal } from 'react-dom';
import { useState } from 'react';

interface ContractFormData {
  contractNumber: string;
  academyName: string;
  representativeName: string;
  nif: string;
  address: string;
  city: string;
  email: string;
  plan: string;
  monthlyPrice: string;
  startDate: string;
  notes: string;
}

interface ContractModalProps {
  academy: {
    id: string;
    name: string;
    ownerName: string;
    ownerEmail: string;
  };
  onClose: () => void;
}

function generateContractHTML(data: ContractFormData): string {
  const today = new Date(data.startDate || Date.now()).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Contrato de Prestación de Servicios — ${data.academyName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.7; color: #111; background: white; padding: 40px 60px; max-width: 800px; margin: auto; }
  h1 { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 11pt; color: #555; margin-bottom: 30px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 10pt; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 24px; }
  h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 22px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  p { margin-bottom: 10px; text-align: justify; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 16px 0; }
  .party-box { border: 1px solid #ddd; border-radius: 6px; padding: 14px; background: #fafafa; }
  .party-box strong { display: block; font-size: 11pt; margin-bottom: 6px; }
  .party-box span { font-size: 10pt; color: #444; display: block; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; font-size: 11pt; }
  th { background: #f3f3f3; font-weight: bold; text-align: left; }
  .signatures { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
  .sig-block { text-align: center; }
  .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 8px; font-size: 10pt; color: #555; }
  @media print {
    body { padding: 20px 40px; }
    @page { margin: 2cm; }
  }
</style>
</head>
<body>

<h1>Contrato de Prestación de Servicios</h1>
<p class="subtitle">Plataforma AKADEMO — Servicios de Gestión Educativa Digital</p>

<div class="meta-row">
  <span><strong>N.º Contrato:</strong> ${data.contractNumber || '—'}</span>
  <span><strong>Fecha:</strong> ${today}</span>
</div>

<h2>Partes del Contrato</h2>
<div class="parties">
  <div class="party-box">
    <strong>AKADEMO (Prestador del Servicio)</strong>
    <span>Plataforma AKADEMO</span>
    <span>Servicios de gestión educativa digital</span>
    <span>kontakt@akademo-edu.com</span>
  </div>
  <div class="party-box">
    <strong>Cliente (Academia)</strong>
    <span><b>Academia:</b> ${data.academyName}</span>
    <span><b>Representante:</b> ${data.representativeName}</span>
    <span><b>NIF/CIF:</b> ${data.nif}</span>
    <span><b>Dirección:</b> ${data.address}${data.city ? ', ' + data.city : ''}</span>
    <span><b>Email:</b> ${data.email}</span>
  </div>
</div>

<h2>1. Objeto del Contrato</h2>
<p>El presente contrato regula la prestación de servicios de la plataforma tecnológica AKADEMO a la academia identificada como <strong>${data.academyName}</strong>, que incluye el acceso a las funcionalidades de gestión de clases, estudiantes, contenido multimedia, herramientas de evaluación y comunicación, conforme al plan contratado.</p>

<h2>2. Plan y Condiciones Económicas</h2>
<table>
  <tr><th>Plan contratado</th><td>${data.plan || '—'}</td></tr>
  <tr><th>Precio mensual</th><td>${data.monthlyPrice ? data.monthlyPrice + ' €' : '—'}</td></tr>
  <tr><th>Fecha de inicio</th><td>${today}</td></tr>
  <tr><th>Periodo de contrato</th><td>Indefinido, con preaviso de 30 días para la rescisión</td></tr>
</table>

<h2>3. Obligaciones de AKADEMO</h2>
<p>AKADEMO se compromete a: (a) mantener disponible la plataforma con un nivel de servicio razonable; (b) proporcionar actualizaciones y mejoras sin coste adicional; (c) proteger los datos de la academia conforme al RGPD; (d) ofrecer soporte técnico por los canales habilitados.</p>

<h2>4. Obligaciones del Cliente</h2>
<p>La academia se compromete a: (a) abonar puntualmente las facturas emitidas; (b) usar la plataforma conforme a la legislación vigente y las condiciones de uso; (c) mantener la confidencialidad de los accesos; (d) no ceder ni sublicenciar el acceso a terceros.</p>

<h2>5. Protección de Datos</h2>
<p>Ambas partes se comprometen a cumplir el Reglamento General de Protección de Datos (RGPD) 2016/679. Los datos tratados en la plataforma son responsabilidad de la academia como responsable del tratamiento, siendo AKADEMO encargado del tratamiento conforme al Acuerdo de Encargo de Tratamiento adjunto.</p>

<h2>6. Duración y Rescisión</h2>
<p>El contrato entra en vigor en la fecha de firma y tiene carácter indefinido. Cualquiera de las partes podrá rescindirlo con un preaviso mínimo de 30 días naturales por escrito. En caso de impago, AKADEMO podrá suspender el acceso al servicio de forma inmediata.</p>

<h2>7. Jurisdicción</h2>
<p>En caso de controversia, las partes se someten a los Juzgados y Tribunales del domicilio del prestador del servicio, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.</p>

${data.notes ? `<h2>8. Notas Adicionales</h2><p>${data.notes}</p>` : ''}

<div class="signatures">
  <div class="sig-block">
    <div class="sig-line">
      Por AKADEMO<br>Firma y sello
    </div>
  </div>
  <div class="sig-block">
    <div class="sig-line">
      Por ${data.representativeName || data.academyName}<br>Firma y sello
    </div>
  </div>
</div>

</body>
</html>`;
}

export function ContractModal({ academy, onClose }: ContractModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<ContractFormData>({
    contractNumber: `AKD-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
    academyName: academy.name,
    representativeName: academy.ownerName,
    nif: '',
    address: '',
    city: '',
    email: academy.ownerEmail,
    plan: 'Básico',
    monthlyPrice: '',
    startDate: today,
    notes: '',
  });
  const [generating, setGenerating] = useState(false);

  const set = (field: keyof ContractFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleGenerate = () => {
    setGenerating(true);
    try {
      const html = generateContractHTML(formData);
      const printWindow = window.open('', '_blank', 'width=900,height=1100');
      if (!printWindow) {
        alert('Activa las ventanas emergentes para generar el PDF.');
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 600);
    } finally {
      setGenerating(false);
    }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Generar contrato PSD</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{academy.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N.º Contrato</label>
              <input value={formData.contractNumber} onChange={set('contractNumber')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de inicio</label>
              <input type="date" value={formData.startDate} onChange={set('startDate')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la academia</label>
            <input value={formData.academyName} onChange={set('academyName')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Representante legal</label>
              <input value={formData.representativeName} onChange={set('representativeName')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">NIF / CIF</label>
              <input value={formData.nif} onChange={set('nif')} placeholder="B12345678"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
            <input value={formData.address} onChange={set('address')} placeholder="Calle, número, piso..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad</label>
              <input value={formData.city} onChange={set('city')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={formData.email} onChange={set('email')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
              <select value={formData.plan} onChange={set('plan')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option>Básico</option>
                <option>Estándar</option>
                <option>Premium</option>
                <option>Personalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Precio mensual (€)</label>
              <input value={formData.monthlyPrice} onChange={set('monthlyPrice')} placeholder="49" type="number" min="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas adicionales <span className="text-gray-400">(opcional)</span></label>
            <textarea value={formData.notes} onChange={set('notes')} rows={2}
              placeholder="Condiciones especiales, descuentos, etc."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Se abrirá una ventana de previsualización. Usa <strong>Imprimir → Guardar como PDF</strong> para descargar el contrato.
            El PDF es generado completamente en tu navegador, sin coste adicional.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !formData.academyName || !formData.representativeName}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar contrato PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
