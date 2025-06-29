import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './UserProvider';

const AuthChecker = ({ 
  children, 
  requireAuth = true,
  redirectTo = '/auth',
  redirectIfAuthenticated = false,
  redirectAuthenticatedTo = '/'
}) => {
  const { user, loading } = useUser();
  const location = useLocation();

  const authStatus = useMemo(() => {
    if (loading) return 'loading';
    if (requireAuth && !user) return 'unauthenticated';
    if (redirectIfAuthenticated && user) return 'redirect-authenticated';
    return 'authenticated';
  }, [user, loading, requireAuth, redirectIfAuthenticated]);

  if (authStatus === 'loading') {
    return <div className="auth-loading-spinner">Loading...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (authStatus === 'redirect-authenticated') {
    return <Navigate to={redirectAuthenticatedTo} replace />;
  }

  return <>{children}</>;
};

export default React.memo(AuthChecker);