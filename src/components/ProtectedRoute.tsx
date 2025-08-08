import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../lib/adminConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresProducer?: boolean;
  requiresClient?: boolean;
  requiresAdmin?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiresProducer = false,
  requiresClient = false,
  requiresAdmin = false
}: ProtectedRouteProps) {
  const { user, loading, accountType } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.email && isAdminEmail(user.email);

  // Admins can access all routes
  if (isAdmin) {
    return <>{children}</>;
  }

  // Route-specific checks for non-admin users
  // Only redirect if we're certain the user is not an admin and accountType is loaded
  if (requiresAdmin && accountType && accountType !== 'admin' && accountType !== 'admin,producer') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check for producer access (including dual roles)
  if (requiresProducer && accountType && !accountType.includes('producer')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiresClient && accountType && accountType !== 'client' && accountType !== 'white_label') {
    return <Navigate to="/producer/dashboard" replace />;
  }

  // If accountType is still loading or null, show loading instead of redirecting
  if (requiresAdmin && !accountType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
