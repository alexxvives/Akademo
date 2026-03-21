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
        <h2 className="text-xl sm:text-xl sm:text-2xl font-bold text-gray-900 mb-3">Únete a una Academia</h2>
        <p className="text-gray-600 mb-8">
          Necesitas unirte a una academia e inscribirte en clases para comenzar a aprender.
        </p>
        <Link
          href="/dashboard/student/explore"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Explorar Academias
        </Link>
      </div>
    </div>
  );
}
