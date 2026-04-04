import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export const Navbar = () => {
    const { user, logout } = useAuth();
    return (_jsxs("header", { className: "navbar", children: [_jsx("div", { className: "navbar__brand", children: "StaffInn" }), _jsx("nav", { className: "navbar__links", children: !user ? (_jsxs(_Fragment, { children: [_jsx(Link, { to: "/login", children: "Login" }), _jsx(Link, { to: "/register", children: "Register" })] })) : (_jsxs(_Fragment, { children: [user.role === 'CANDIDATE' && _jsx(Link, { to: "/candidate", children: "Candidate Dashboard" }), user.role === 'HOTEL' && _jsx(Link, { to: "/hotel", children: "Hotel Dashboard" }), user.role === 'ADMIN' && _jsx(Link, { to: "/admin", children: "Admin Panel" }), _jsx("button", { type: "button", onClick: () => logout(), children: "Logout" })] })) })] }));
};
