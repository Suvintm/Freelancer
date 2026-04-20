'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, requiresMfa } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      if (requiresMfa) {
        router.replace('/auth/mfa');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, requiresMfa, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
