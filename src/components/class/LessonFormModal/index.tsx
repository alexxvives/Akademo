'use client';

import { StyledSelect } from '@/components/ui/StyledSelect';
import { FormInput } from '@/components/ui/FormInput';
import { FormTextarea } from '@/components/ui/FormTextarea';
import type { Topic, LessonFormData, EditingLessonMedia } from '../types';
import { PublishOptions } from './PublishOptions';
import { CreateModeUploads } from './CreateModeUploads';
import { EditModeMedia } from './EditModeMedia';
import { UploadProgressBar } from './UploadProgressBar';

interface LessonFormModalProps {
  formData: LessonFormData;
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>;
  topics: Topic[];
  editingLessonId: string | null;
  editingLessonMedia: EditingLessonMedia | null;
  uploading: boolean;
  uploadProgress: number;
  uploadSpeed: number;
  uploadETA: number;
  paymentStatus: string;
  availableStreamRecordings: Array<{ id: string; title: string; createdAt: string }>;
  onSubmitCreate: (e: React.FormEvent) => void;
  onSubmitUpdate: (e: React.FormEvent) => void;
  onClose: () => void;
  onDeleteVideo: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onAddVideo: (file: File) => void;
  onAddDocument: (file: File) => void;
  onAddLink: (title: string, url: string) => Promise<void>;
  onDeleteLink: (linkId: string) => Promise<void>;
}

export default function LessonFormModal({
  formData,
  setFormData,
  topics,
  editingLessonId,
  editingLessonMedia,
  uploading,
  uploadProgress,
  uploadSpeed,
  uploadETA,
  paymentStatus,
  availableStreamRecordings,
  onSubmitCreate,
  onSubmitUpdate,
  onClose,
  onDeleteVideo,
  onDeleteDocument,
  onAddVideo,
  onAddDocument,
  onAddLink,
  onDeleteLink,
}: LessonFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 !m-0 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">
            {editingLessonId ? 'Editar Clase' : 'Crear Nueva Clase'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={editingLessonId ? onSubmitUpdate : onSubmitCreate} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Row 1: Title | Topic */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
              <FormInput
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titulo de la clase"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tema</label>
              <StyledSelect
                value={formData.topicId}
                onChange={(v) => setFormData(prev => ({ ...prev, topicId: v }))}
                options={[
                  { value: '', label: 'Sin tema' },
                  ...topics.map(topic => ({ value: topic.id, label: topic.name })),
                ]}
                placeholder="Sin tema"
              />
            </div>
          </div>

          {/* Row 2: Publish options — CREATE mode only */}
          {!editingLessonId && <PublishOptions formData={formData} setFormData={setFormData} />}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
            <FormTextarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Descripcion de la clase"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Multiplicador <span className="text-xs font-normal text-gray-500">(El video podrá verse durante X veces su duración)</span></label>
              <FormInput type="number" min="0" max="10" step="0.5" value={formData.maxWatchTimeMultiplier} onChange={e => setFormData(prev => ({ ...prev, maxWatchTimeMultiplier: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca de agua <span className="text-xs font-normal text-gray-500">(Cada cuántos minutos aparece)</span></label>
              <FormInput type="number" min="0" max="60" step="0.5" value={formData.watermarkIntervalMins} onChange={e => setFormData(prev => ({ ...prev, watermarkIntervalMins: parseFloat(e.target.value) }))} />
            </div>
          </div>

          {/* CREATE MODE: File upload fields */}
          {!editingLessonId && (
            <CreateModeUploads
              formData={formData}
              setFormData={setFormData}
              availableStreamRecordings={availableStreamRecordings}
              onAddVideo={onAddVideo}
              onAddDocument={onAddDocument}
            />
          )}

          {/* EDIT MODE: Current media + add more */}
          {editingLessonId && editingLessonMedia && (
            <EditModeMedia
              formData={formData}
              setFormData={setFormData}
              editingLessonMedia={editingLessonMedia}
              availableStreamRecordings={availableStreamRecordings}
              onDeleteVideo={onDeleteVideo}
              onDeleteDocument={onDeleteDocument}
              onAddVideo={onAddVideo}
              onAddDocument={onAddDocument}
              onAddLink={onAddLink}
              onDeleteLink={onDeleteLink}
            />
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <UploadProgressBar
              uploadProgress={uploadProgress}
              uploadSpeed={uploadSpeed}
              uploadETA={uploadETA}
            />
          )}

          <div className="flex gap-3 justify-center">
            <button
              type="submit"
              disabled={paymentStatus === 'NOT PAID'}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={paymentStatus === 'NOT PAID' ? 'Active su academia para crear lecciones' : ''}
            >
              {uploading ? 'Creando...' : editingLessonId ? 'Actualizar Lección' : 'Crear Lección'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
