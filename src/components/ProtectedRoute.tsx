import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproval?: boolean;
}

export function ProtectedRoute({ children, requireApproval = true }: ProtectedRouteProps) {
  const { user, loading: authLoading, isApproved, profile } = useAuth();
  const storeLoading = useStore((state) => state.loading);
  const currentUserId = useStore((state) => state.currentUserId);

  // Wait for both auth and store to be ready
  const isLoading = authLoading || (isApproved && (!currentUserId || storeLoading));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireApproval && profile && !isApproved) {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}
