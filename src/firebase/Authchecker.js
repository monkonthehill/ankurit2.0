// src/firebase/Authchecker.js
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './UserProvider';

const AuthChecker = ({ 
  children, 
  requireAuth = true,
  requireProfileComplete = false
}) => {
  const { user, loading, profileCompleted } = useUser();
  const location = useLocation();

  useEffect(() => {
    // No cleanup needed for this effect
    return () => {}; // Explicit empty cleanup function
  }, []);

  if (loading) {
    return <div className="auth-loading-spinner">Loading...</div>;
  }

  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireProfileComplete && user && !profileCompleted) {
    return <Navigate to="/profile_setup" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default React.memo(AuthChecker);