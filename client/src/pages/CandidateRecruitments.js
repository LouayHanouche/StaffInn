import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { DashboardLayout } from '../components/DashboardLayout';
export const CandidateRecruitments = () => {
    const applicationsQuery = useQuery({
        queryKey: ['candidate-applications'],
        queryFn: () => api.get('/candidates/applications'),
        refetchInterval: 15_000,
    });
    const recruitments = (applicationsQuery.data?.items ?? []).filter((app) => app.status === 'ACCEPTED');
    return (_jsx(DashboardLayout, { title: "Recrutements", children: _jsxs("div", { className: "card", children: [_jsx("div", { className: "card__header", children: _jsx("h2", { className: "card__title", children: "\u2705 Offres o\u00F9 vous \u00EAtes recrut\u00E9" }) }), recruitments.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state__icon", children: "\uD83C\uDFAF" }), _jsx("p", { className: "empty-state__text", children: "Aucun recrutement pour le moment" }), _jsx("p", { className: "empty-state__subtext", children: "Vos offres accept\u00E9es appara\u00EEtront ici" })] })) : (_jsx("div", { className: "grid-auto", children: recruitments.map((recruitment) => (_jsxs("div", { className: "job-card job-card--recruited", children: [_jsx("div", { className: "job-card__badge", children: "\u2705 Recrut\u00E9" }), _jsx("div", { className: "job-card__image", children: "\uD83C\uDFE8" }), _jsxs("div", { className: "job-card__content", children: [_jsx("h3", { className: "job-card__title", children: recruitment.jobOffer.title }), _jsx("p", { className: "job-card__company", children: recruitment.jobOffer.hotel.name }), recruitment.jobOffer.description && (_jsxs("p", { className: "job-card__description", children: [recruitment.jobOffer.description.slice(0, 100), recruitment.jobOffer.description.length > 100 ? '...' : ''] })), _jsx("div", { className: "job-card__meta", children: _jsx("span", { className: "status-pill status-pill--active", children: "Accept\u00E9" }) })] })] }, recruitment.id))) }))] }) }));
};
