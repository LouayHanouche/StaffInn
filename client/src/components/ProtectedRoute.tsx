import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<'HOTEL' | 'CANDIDATE' | 'ADMIN'>;
  children: JSX.Element;
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="card">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
