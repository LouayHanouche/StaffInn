import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
const CandidateDashboard = lazy(() => import('./pages/CandidateDashboard').then((module) => ({ default: module.CandidateDashboard })));
const CandidateProfile = lazy(() => import('./pages/CandidateProfile').then((module) => ({ default: module.CandidateProfile })));
const CandidateApplications = lazy(() => import('./pages/CandidateApplications').then((module) => ({ default: module.CandidateApplications })));
const CandidateRecruitments = lazy(() => import('./pages/CandidateRecruitments').then((module) => ({ default: module.CandidateRecruitments })));
const HotelDashboard = lazy(() => import('./pages/HotelDashboard').then((module) => ({ default: module.HotelDashboard })));
const CVDatabase = lazy(() => import('./pages/CVDatabase').then((module) => ({ default: module.CVDatabase })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then((module) => ({ default: module.AdminPanel })));
const HomeRedirect = () => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "loading-fullscreen", children: _jsx("div", { className: "loading-spinner" }) }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    if (user.role === 'CANDIDATE') {
        return _jsx(Navigate, { to: "/candidate/profile", replace: true });
    }
    if (user.role === 'HOTEL') {
        return _jsx(Navigate, { to: "/hotel", replace: true });
    }
    return _jsx(Navigate, { to: "/admin", replace: true });
};
const LoadingFallback = () => (_jsx("div", { className: "loading-fullscreen", children: _jsx("div", { className: "loading-spinner" }) }));
export const App = () => {
    const location = useLocation();
    return (_jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx("div", { className: "route-transition", children: _jsxs(Routes, { location: location, children: [_jsx(Route, { path: "/", element: _jsx(HomeRedirect, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/candidate", element: _jsx(ProtectedRoute, { allowedRoles: ['CANDIDATE'], children: _jsx(CandidateDashboard, {}) }) }), _jsx(Route, { path: "/candidate/profile", element: _jsx(ProtectedRoute, { allowedRoles: ['CANDIDATE'], children: _jsx(CandidateProfile, {}) }) }), _jsx(Route, { path: "/candidate/applications", element: _jsx(ProtectedRoute, { allowedRoles: ['CANDIDATE'], children: _jsx(CandidateApplications, {}) }) }), _jsx(Route, { path: "/candidate/recruitments", element: _jsx(ProtectedRoute, { allowedRoles: ['CANDIDATE'], children: _jsx(CandidateRecruitments, {}) }) }), _jsx(Route, { path: "/hotel", element: _jsx(ProtectedRoute, { allowedRoles: ['HOTEL'], children: _jsx(HotelDashboard, {}) }) }), _jsx(Route, { path: "/cv-database", element: _jsx(ProtectedRoute, { allowedRoles: ['HOTEL'], children: _jsx(CVDatabase, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(ProtectedRoute, { allowedRoles: ['ADMIN'], children: _jsx(AdminPanel, {}) }) })] }) }, location.pathname) }));
};
