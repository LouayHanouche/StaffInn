import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
export const DashboardLayout = ({ title, children }) => {
    return (_jsxs("div", { className: "dashboard-layout", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "dashboard-main", children: [_jsx(DashboardHeader, { title: title }), _jsx("div", { className: "dashboard-content", children: children })] })] }));
};
