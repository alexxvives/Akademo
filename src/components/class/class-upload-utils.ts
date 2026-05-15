import { uploadToBunny } from '@/lib/bunny-upload';
import { multipartUpload } from '@/lib/multipart-upload';
import type { Lesson } from './types';

interface UploadCallbacks {
  onOverallProgress: (progress: number) => void;
  onSpeedUpdate: (speed: number, eta: number) => void;
  onLessonProgress: (lessonId: string, progress: number) => void;
}

interface UploadedVideo {
  bunnyGuid: string;
  bunnyStatus: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  title: string;
  description: string;
  durationSeconds: number;
}

interface UploadedDocument {
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  title: string;
  description: string;
  allowDownload: boolean;
}

interface UploadResult {
  videos: UploadedVideo[];
  documents: UploadedDocument[];
}

export async function uploadFilesToServices(
  videos: Array<{ file: File; title: string; description: string; duration: number }>,
  documents: Array<{ file: File; title: string; description: string; allowDownload?: boolean }>,
  collectionName: string | undefined,
  parentCollectionName: string | undefined,
  tempLessonId: string,
  callbacks: UploadCallbacks,
  lastProgressRef: React.MutableRefObject<{ loaded: number; time: number }>,
  signal: AbortSignal,
): Promise<UploadResult> {
  const uploadedVideos: UploadedVideo[] = [];
  const uploadedDocuments: UploadedDocument[] = [];
  let totalSize = 0;
  let uploadedSize = 0;

  videos.forEach(v => totalSize += v.file.size);
  documents.forEach(d => totalSize += d.file.size);

  for (const video of videos) {
    const result = await uploadToBunny({
      file: video.file,
      title: video.title || video.file.name,
      collectionName,
      parentCollectionName,
      onProgress: (progress) => {
        const totalUploaded = uploadedSize + progress.loaded;
        const overallProgress = (totalUploaded / totalSize) * 100;
        const now = Date.now();
        const timeDiff = (now - lastProgressRef.current.time) / 1000;
        if (timeDiff > 0.5) {
          const bytesDiff = totalUploaded - lastProgressRef.current.loaded;
          const speed = bytesDiff / timeDiff;
          const remaining = totalSize - totalUploaded;
          callbacks.onSpeedUpdate(speed, speed > 0 ? remaining / speed : 0);
          lastProgressRef.current = { loaded: totalUploaded, time: now };
        }
        callbacks.onOverallProgress(overallProgress);
        callbacks.onLessonProgress(tempLessonId, overallProgress);
      },
      signal,
    });
    uploadedSize += video.file.size;
    uploadedVideos.push({
      bunnyGuid: result.videoGuid, bunnyStatus: 1,
      fileName: video.file.name, fileSize: video.file.size, mimeType: video.file.type,
      title: video.title, description: video.description, durationSeconds: video.duration,
    });
  }

  for (const doc of documents) {
    const storagePath = await multipartUpload({
      file: doc.file, folder: 'documents',
      onProgress: (progress) => {
        const totalUploaded = uploadedSize + progress.loaded;
        const overallProgress = (totalUploaded / totalSize) * 100;
        const now = Date.now();
        const timeDiff = (now - lastProgressRef.current.time) / 1000;
        if (timeDiff > 0.5) {
          const bytesDiff = totalUploaded - lastProgressRef.current.loaded;
          const speed = bytesDiff / timeDiff;
          const remaining = totalSize - totalUploaded;
          callbacks.onSpeedUpdate(speed, speed > 0 ? remaining / speed : 0);
          lastProgressRef.current = { loaded: totalUploaded, time: now };
        }
        callbacks.onOverallProgress(overallProgress);
        callbacks.onLessonProgress(tempLessonId, overallProgress);
      },
      signal,
    });
    uploadedSize += doc.file.size;
    uploadedDocuments.push({
      storagePath, fileName: doc.file.name, fileSize: doc.file.size,
      mimeType: doc.file.type, title: doc.title, description: doc.description,
      allowDownload: doc.allowDownload ?? false,
    });
  }

  return { videos: uploadedVideos, documents: uploadedDocuments };
}

// Add a video file to form data with duration detection
export function createVideoFormEntry(
  file: File,
  callback: (entry: { file: File; title: string; description: string; duration: number }) => void,
) {
  if (file.size > 5 * 1024 * 1024 * 1024) {
    alert('File size must be under 5GB');
    return;
  }
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.onloadedmetadata = () => {
    window.URL.revokeObjectURL(video.src);
    callback({ file, title: '', description: '', duration: Math.floor(video.duration) });
  };
  video.src = URL.createObjectURL(file);
}

// Type for lesson upload progress tracking
export type SetLessonsUpdater = React.Dispatch<React.SetStateAction<Lesson[]>>;
