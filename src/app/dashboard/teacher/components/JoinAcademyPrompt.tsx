interface JoinAcademyPromptProps {
  onBrowse: () => void;
}

export function JoinAcademyPrompt({ onBrowse }: JoinAcademyPromptProps) {
  return (
    <div className="max-w-2xl mx-auto mt-8 sm:mt-20">
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Join an Academy First</h2>
        <p className="text-gray-600 mb-8">
          You need to be part of an academy before you can create classes and manage students.
        </p>
        <button
          onClick={onBrowse}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse Academies
        </button>
      </div>
    </div>
  );
}
