'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui';

export default function AdminClassRedirect() {
  const params = useParams();
  const router = useRouter();
  
  useEffect(() => {
    // Redirect admin to academy view for now (admins have full access anyway)
    if (params.id) {
      router.replace(`/dashboard/academy/class/${params.id}`);
    }
  }, [params.id, router]);

  return <PageLoader />;
}
