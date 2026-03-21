export function AssignmentsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-36 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <th key={i} className="px-6 py-3">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i}>
                <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
