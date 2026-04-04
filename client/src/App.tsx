import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const CandidateDashboard = lazy(() =>
  import('./pages/CandidateDashboard').then((module) => ({ default: module.CandidateDashboard }))
);
const CandidateProfile = lazy(() =>
  import('./pages/CandidateProfile').then((module) => ({ default: module.CandidateProfile }))
);
const CandidateApplications = lazy(() =>
  import('./pages/CandidateApplications').then((module) => ({ default: module.CandidateApplications }))
);
const CandidateRecruitments = lazy(() =>
  import('./pages/CandidateRecruitments').then((module) => ({ default: module.CandidateRecruitments }))
);
const HotelDashboard = lazy(() =>
  import('./pages/HotelDashboard').then((module) => ({ default: module.HotelDashboard }))
);
const CVDatabase = lazy(() =>
  import('./pages/CVDatabase').then((module) => ({ default: module.CVDatabase }))
);
const AdminPanel = lazy(() =>
  import('./pages/AdminPanel').then((module) => ({ default: module.AdminPanel }))
);

const HomeRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'CANDIDATE') {
    return <Navigate to="/candidate/profile" replace />;
  }
  if (user.role === 'HOTEL') {
    return <Navigate to="/hotel" replace />;
  }
  return <Navigate to="/admin" replace />;
};

const LoadingFallback = () => (
  <div className="loading-fullscreen">
    <div className="loading-spinner" />
  </div>
);

export const App = (): JSX.Element => {
  const location = useLocation();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <div key={location.pathname} className="route-transition">
        <Routes location={location}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/candidate"
            element={
              <ProtectedRoute allowedRoles={['CANDIDATE']}>
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/profile"
            element={
              <ProtectedRoute allowedRoles={['CANDIDATE']}>
                <CandidateProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/applications"
            element={
              <ProtectedRoute allowedRoles={['CANDIDATE']}>
                <CandidateApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/recruitments"
            element={
              <ProtectedRoute allowedRoles={['CANDIDATE']}>
                <CandidateRecruitments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hotel"
            element={
              <ProtectedRoute allowedRoles={['HOTEL']}>
                <HotelDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cv-database"
            element={
              <ProtectedRoute allowedRoles={['HOTEL']}>
                <CVDatabase />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Suspense>
  );
};
