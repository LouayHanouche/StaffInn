import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const candidateLinks = [
        { path: '/candidate/profile', icon: '👤', label: 'Mon Profil' },
        { path: '/candidate', icon: '🏠', label: "Vue d'ensemble" },
        { path: '/candidate/applications', icon: '📋', label: 'Candidatures' },
        { path: '/candidate/recruitments', icon: '✅', label: 'Recruté' },
    ];
    const hotelLinks = [
        { path: '/hotel', icon: '🏠', label: 'Tableau de Bord' },
        { path: '/cv-database', icon: '👥', label: 'Candidats' },
    ];
    const adminLinks = [{ path: '/admin', icon: '🏠', label: 'Administration' }];
    const links = user?.role === 'ADMIN' ? adminLinks : user?.role === 'HOTEL' ? hotelLinks : candidateLinks;
    return (_jsxs("aside", { className: "sidebar", children: [_jsx("div", { className: "sidebar__logo", children: _jsx("img", { src: "/logo.svg", alt: "StaffInn", className: "sidebar__logo-img" }) }), _jsx("nav", { className: "sidebar__nav", children: links.map((link) => (_jsx(NavLink, { to: link.path, className: `sidebar__item ${isActive(link.path) ? 'sidebar__item--active' : ''}`, title: link.label, children: link.icon }, link.path))) })] }));
};
