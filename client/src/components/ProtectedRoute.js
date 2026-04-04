import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export const ProtectedRoute = ({ allowedRoles, children, }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return _jsx("div", { className: "card", children: "Loading..." });
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    if (!allowedRoles.includes(user.role)) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return children;
};
