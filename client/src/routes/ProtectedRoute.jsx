import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = () => {
  const { user, hasSeenOnboarding } = useAuthStore();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user hasn't seen onboarding and isn't already on the onboarding page, redirect there
  if (!hasSeenOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has seen onboarding and is trying to access onboarding, redirect to dashboard
  if (hasSeenOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;
