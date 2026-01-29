'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/student/classes');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Redirecting...</div>
    </div>
  );
}
