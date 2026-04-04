import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { DashboardLayout } from '../components/DashboardLayout';
export const CandidateApplications = () => {
    const applicationsQuery = useQuery({
        queryKey: ['candidate-applications'],
        queryFn: () => api.get('/candidates/applications'),
        refetchInterval: 15_000,
    });
    const applications = applicationsQuery.data?.items ?? [];
    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING':
                return 'En attente';
            case 'INTERVIEW':
                return 'Entretien';
            case 'ACCEPTED':
                return 'Recruté';
            case 'REJECTED':
                return 'Refusée';
            default:
                return status;
        }
    };
    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING':
                return 'status-pill--pending';
            case 'INTERVIEW':
                return 'status-pill--active';
            case 'ACCEPTED':
                return 'status-pill--active';
            case 'REJECTED':
                return 'status-pill--rejected';
            default:
                return '';
        }
    };
    return (_jsx(DashboardLayout, { title: "Candidatures", children: _jsxs("div", { className: "card", children: [_jsx("div", { className: "card__header", children: _jsx("h2", { className: "card__title", children: "\uD83D\uDCCB Mes candidatures" }) }), applications.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state__icon", children: "\uD83D\uDCED" }), _jsx("p", { className: "empty-state__text", children: "Aucune candidature" })] })) : (_jsx("div", { className: "applications-table", children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Poste" }), _jsx("th", { children: "H\u00F4tel" }), _jsx("th", { children: "Statut" })] }) }), _jsx("tbody", { children: applications.map((app) => (_jsxs("tr", { children: [_jsx("td", { children: app.jobOffer.title }), _jsx("td", { children: app.jobOffer.hotel.name }), _jsx("td", { children: _jsx("span", { className: `status-pill ${getStatusClass(app.status)}`, children: getStatusLabel(app.status) }) })] }, app.id))) })] }) }))] }) }));
};
