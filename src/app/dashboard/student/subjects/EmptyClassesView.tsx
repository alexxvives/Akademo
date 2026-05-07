import Link from 'next/link';

export default function EmptyClassesView() {
  return (
    <div className="max-w-2xl mx-auto mt-8 sm:mt-20">
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-12 text-center">
        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Aún no tienes clases</h2>
        <p className="text-gray-500 text-sm mb-6">
          Únete a las clases que ofrece tu academia.
        </p>
        <Link
          href="/dashboard/student/enrolled-academies/subjects"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1c29] text-[#b1e787] font-semibold rounded-xl hover:bg-[#2a2d3e] transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Unirse a una Clase
        </Link>
      </div>
    </div>
  );
}
