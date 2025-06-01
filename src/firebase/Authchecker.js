import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './UserProvider';

const AuthChecker = ({ children, requireAuth = true }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  // Memoize the auth check to prevent unnecessary re-renders
  const authStatus = useMemo(() => {
    if (loading) return 'loading';
    if (requireAuth && !user) return 'unauthenticated';
    return 'authenticated';
  }, [user, loading, requireAuth]);

  if (authStatus === 'loading') {
    return <div className="auth-loading-spinner">Loading...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default React.memo(AuthChecker);