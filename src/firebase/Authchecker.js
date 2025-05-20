import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// Adjust the import path based on the actual location of your UserProvider.js file
import { useUser } from './UserProvider';

// AuthChecker component to protect routes
// It checks the authentication status using the useUser hook from your UserProvider.
// If requireAuth is true (default), it redirects to the auth page if the user is not logged in.
// If requireAuth is false, it allows access but the user object might be null.
const AuthChecker = ({ children, requireAuth = true }) => {
  // Get user and loading state from your UserProvider context
  const { user, loading } = useUser();
  // Get the current location to redirect back after login
  const location = useLocation();

  // While authentication state is still loading, you might render a loading spinner
  // This prevents showing content or redirecting before the auth state is known.
  if (loading) {
    // Optional: Render a loading indicator while authentication status is being determined
    // You might want a more sophisticated loading component here
    return <div className="auth-loading-spinner">Loading authentication...</div>;
  }

  // If requireAuth is true and there is no user, redirect to the authentication page
  // We also pass the current location in the state so the user can be redirected back
  // after successful login.
  if (requireAuth && !user) {
    console.log("AuthChecker: User not authenticated, redirecting to /auth");
    // Navigate to the authentication page, replacing the current history entry
    // Pass the current location in the state so the AuthPage can redirect back
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If requireAuth is false, or if requireAuth is true and there is a user,
  // render the children components (the protected route).
  // If requireAuth is false, the user object might still be null, but access is allowed.
  console.log(`AuthChecker: User is ${user ? 'authenticated' : 'not authenticated (access allowed)'}, rendering children.`);
  return <>{children}</>;
};

export default AuthChecker;
