import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function DataTable({ columns, data, keyExtractor }) {
    return (_jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((col) => (_jsx("th", { children: col.header }, col.key))) }) }), _jsxs("tbody", { children: [data.map((item) => (_jsx("tr", { children: columns.map((col) => (_jsx("td", { children: col.render
                                ? col.render(item)
                                : String(item[col.key] ?? '') }, col.key))) }, keyExtractor(item)))), data.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, children: _jsx("div", { className: "empty-state", children: _jsx("div", { className: "empty-state__text", children: "Aucune donn\u00E9e disponible" }) }) }) }))] })] }));
}
