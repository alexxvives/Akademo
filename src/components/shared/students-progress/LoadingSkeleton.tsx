export function LoadingSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 sm:w-56 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 sm:w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="h-10 w-full sm:w-64 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-full sm:w-48 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-6 w-64 bg-gray-200 rounded mb-4 animate-pulse"></div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Info row */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {/* Table header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-4 px-6 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        {/* Table rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 px-6 py-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-5 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
