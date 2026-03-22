'use client';

import { ArchivedVideoCard } from './ArchivedVideoCard';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import type { ArchivedVideoItem } from './types';

interface Props {
  videos: ArchivedVideoItem[];
  loading: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

export function ArchivedVideosGrid({ videos, loading, canDelete, onDelete }: Props) {
  if (loading) return <SkeletonTable rows={4} cols={1} />;

  if (!videos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No hay videos archivados</p>
        <p className="text-gray-400 text-sm mt-1">Sube un video para guardarlo en el archivo</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map(video => (
        <ArchivedVideoCard
          key={video.id}
          video={video}
          canDelete={canDelete}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
