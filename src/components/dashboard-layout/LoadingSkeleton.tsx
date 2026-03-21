export function LoadingSkeleton() {
  return (
    <div className="dashboard-layout min-h-screen bg-[#111318] flex flex-col lg:flex-row">
      {/* Mobile loading header */}
      <div className="lg:hidden h-14 bg-[#1a1d29] flex items-center px-4">
        <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
        <div className="ml-3 w-24 h-5 bg-gray-700 rounded animate-pulse" />
      </div>
      <aside className="hidden lg:flex flex-col bg-[#1a1d29] w-64">
        <div className="h-20 flex items-center px-4">
          <div className="w-12 h-12 bg-gray-700 rounded-xl animate-pulse" />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="hidden lg:block h-16 bg-gray-100 border-b" />
        <main className="flex-1 p-4 md:p-8">
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="w-full max-w-sm h-4 bg-gray-200 rounded animate-pulse" />
        </main>
      </div>
    </div>
  );
}
