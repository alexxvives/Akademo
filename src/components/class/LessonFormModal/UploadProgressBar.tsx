interface UploadProgressBarProps {
  uploadProgress: number;
  uploadSpeed: number;
  uploadETA: number;
}

export function UploadProgressBar({ uploadProgress, uploadSpeed, uploadETA }: UploadProgressBarProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <div className="flex items-center gap-3">
          <span className="font-medium">Subiendo archivos...</span>
          {uploadSpeed > 0 && (
            <span className="text-xs text-gray-500">
              {(uploadSpeed / 1024 / 1024).toFixed(1)} MB/s
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {uploadETA > 0 && uploadProgress < 99 && (
            <span className="text-xs text-gray-500">
              ~{Math.ceil(uploadETA / 60)}min restante{Math.ceil(uploadETA / 60) !== 1 ? 's' : ''}
            </span>
          )}
          <span className="font-bold">{Math.round(uploadProgress)}%</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
      <p className="text-xs text-amber-600 mt-2 font-medium">
        ⚠️ No salgas de esta página ni cierres el navegador hasta que termine la subida.
      </p>
    </div>
  );
}
