import { jsx as _jsx } from "react/jsx-runtime";
export const Toast = ({ message, type }) => {
    if (!message) {
        return null;
    }
    return _jsx("div", { className: `toast toast--${type}`, children: message });
};
