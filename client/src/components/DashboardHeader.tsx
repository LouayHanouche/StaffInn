import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface DashboardHeaderProps {
  title: string;
}

export const DashboardHeader = ({ title }: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    setShowDropdown(false);
    void logout();
  };

  return (
    <header className="dashboard-header">
      <h1 className="dashboard-header__title">{title}</h1>
      <div className="dashboard-header__actions">
        <div className="header-avatar-container" ref={dropdownRef}>
          <button
            className="header-avatar"
            onClick={() => setShowDropdown(!showDropdown)}
            title="Mon compte"
          >
            {user?.email ? getInitials(user.email) : '??'}
          </button>
          {showDropdown && (
            <div className="header-dropdown">
              <div className="header-dropdown__info">
                <span className="header-dropdown__email">{user?.email}</span>
                <span className="header-dropdown__role">
                  {user?.role === 'HOTEL'
                    ? 'Recruteur'
                    : user?.role === 'ADMIN'
                      ? 'Administrateur'
                      : 'Candidat'}
                </span>
              </div>
              <div className="header-dropdown__divider" />
              <button className="header-dropdown__item" onClick={handleLogout}>
                🚪 Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
