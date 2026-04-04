import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
export const DashboardHeader = ({ title }) => {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const getInitials = (email) => {
        return email.substring(0, 2).toUpperCase();
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
    return (_jsxs("header", { className: "dashboard-header", children: [_jsx("h1", { className: "dashboard-header__title", children: title }), _jsx("div", { className: "dashboard-header__actions", children: _jsxs("div", { className: "header-avatar-container", ref: dropdownRef, children: [_jsx("button", { className: "header-avatar", onClick: () => setShowDropdown(!showDropdown), title: "Mon compte", children: user?.email ? getInitials(user.email) : '??' }), showDropdown && (_jsxs("div", { className: "header-dropdown", children: [_jsxs("div", { className: "header-dropdown__info", children: [_jsx("span", { className: "header-dropdown__email", children: user?.email }), _jsx("span", { className: "header-dropdown__role", children: user?.role === 'HOTEL'
                                                ? 'Recruteur'
                                                : user?.role === 'ADMIN'
                                                    ? 'Administrateur'
                                                    : 'Candidat' })] }), _jsx("div", { className: "header-dropdown__divider" }), _jsx("button", { className: "header-dropdown__item", onClick: handleLogout, children: "\uD83D\uDEAA D\u00E9connexion" })] }))] }) })] }));
};
