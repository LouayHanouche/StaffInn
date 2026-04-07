import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar = (): JSX.Element => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string): boolean => location.pathname === path;

  const candidateLinks = [
    { path: '/candidate/profile', icon: '👤', label: 'Mon Profil' },
    { path: '/candidate', icon: '🏠', label: "Vue d'ensemble" },
    { path: '/candidate/offers', icon: '🔍', label: 'Offres' },
    { path: '/candidate/applications', icon: '📋', label: 'Candidatures' },
    { path: '/candidate/recruitments', icon: '✅', label: 'Recruté' },
  ];

  const hotelLinks = [
    { path: '/hotel', icon: '🏠', label: 'Tableau de Bord' },
    { path: '/cv-database', icon: '👥', label: 'Candidats' },
  ];

  const adminLinks = [
    { path: '/admin', icon: '🏠', label: 'Administration' },
    { path: '/admin/reports', icon: '📋', label: 'Signalements' },
  ];

  const links =
    user?.role === 'ADMIN' ? adminLinks : user?.role === 'HOTEL' ? hotelLinks : candidateLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <img src="/logo.svg" alt="StaffInn" className="sidebar__logo-img" />
      </div>
      <nav className="sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={`sidebar__item ${isActive(link.path) ? 'sidebar__item--active' : ''}`}
            title={link.label}
          >
            {link.icon}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
