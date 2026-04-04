import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const StatCard = ({ label, value, variant = 'dark' }) => {
    return (_jsx("div", { className: `stat-card ${variant === 'light' ? 'stat-card--light' : ''}`, children: _jsxs("div", { children: [_jsx("div", { className: "stat-card__label", children: label }), _jsx("div", { className: "stat-card__value", children: value })] }) }));
};
