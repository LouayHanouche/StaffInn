import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '../lib/api';
import { Toast } from '../components/Toast';
import { DashboardLayout } from '../components/DashboardLayout';
export const CandidateDashboard = () => {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState({
        message: null,
        type: 'ok',
    });
    const [viewingOffer, setViewingOffer] = useState(null);
    const [applyingOffer, setApplyingOffer] = useState(null);
    const [coverLetter, setCoverLetter] = useState('');
    const applicationsQuery = useQuery({
        queryKey: ['candidate-applications'],
        queryFn: () => api.get('/candidates/applications'),
        refetchInterval: 15_000,
    });
    const offersQuery = useQuery({
        queryKey: ['candidate-offers'],
        queryFn: () => api.get('/offers?page=1&pageSize=6'),
        refetchInterval: 15_000,
    });
    const applyMutation = useMutation({
        mutationFn: (payload) => api.post(`/offers/${payload.offerId}/apply`, {
            coverLetter: payload.coverLetter?.trim() ? payload.coverLetter.trim() : undefined,
        }),
        onSuccess: async () => {
            setToast({ message: 'Candidature envoyée', type: 'ok' });
            await queryClient.invalidateQueries({ queryKey: ['candidate-applications'] });
            setApplyingOffer(null);
            setCoverLetter('');
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                setToast({ message: error.message, type: 'error' });
                return;
            }
            setToast({ message: 'Impossible de postuler', type: 'error' });
        },
    });
    const applications = applicationsQuery.data?.items ?? [];
    const offers = offersQuery.data?.items ?? [];
    const appliedIds = new Set(applications.map((item) => item.jobOfferId));
    const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
    const interviewCount = applications.filter((a) => a.status === 'INTERVIEW').length;
    const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;
    const acceptedCount = applications.filter((a) => a.status === 'ACCEPTED').length;
    return (_jsxs(DashboardLayout, { title: "Tableau de Bord Candidat", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "card__header", children: _jsx("h2", { className: "card__title", children: "Vue d'ensemble" }) }), _jsxs("div", { className: "stats-row", children: [_jsxs("div", { className: "stat-card stat-card--gradient", children: [_jsx("div", { className: "stat-card__icon", children: "\uD83D\uDCCB" }), _jsxs("div", { className: "stat-card__content", children: [_jsx("span", { className: "stat-card__value", children: applications.length }), _jsx("span", { className: "stat-card__label", children: "Candidatures" })] })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-card__icon", children: "\u23F3" }), _jsxs("div", { className: "stat-card__content", children: [_jsx("span", { className: "stat-card__value", children: pendingCount }), _jsx("span", { className: "stat-card__label", children: "En Attente" })] })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-card__icon", children: "\uD83C\uDFAF" }), _jsxs("div", { className: "stat-card__content", children: [_jsx("span", { className: "stat-card__value", children: interviewCount }), _jsx("span", { className: "stat-card__label", children: "Entretiens" })] })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-card__icon", children: "\u2705" }), _jsxs("div", { className: "stat-card__content", children: [_jsx("span", { className: "stat-card__value", children: acceptedCount }), _jsx("span", { className: "stat-card__label", children: "Accept\u00E9es" })] })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-card__icon", children: "\u274C" }), _jsxs("div", { className: "stat-card__content", children: [_jsx("span", { className: "stat-card__value", children: rejectedCount }), _jsx("span", { className: "stat-card__label", children: "Refus\u00E9es" })] })] })] })] }), _jsx("div", { style: { marginTop: '32px' } }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card__header", children: _jsx("h2", { className: "card__title", children: "\uD83C\uDFE8 Offres Recommand\u00E9es" }) }), offers.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state__icon", children: "\uD83D\uDCED" }), _jsx("p", { className: "empty-state__text", children: "Aucune offre disponible" })] })) : (_jsx("div", { className: "grid-auto", children: offers.map((offer) => (_jsxs("div", { className: "job-card", children: [_jsx("div", { className: "job-card__image", children: "\uD83C\uDFE8" }), _jsxs("div", { className: "job-card__content", children: [_jsx("h3", { className: "job-card__title", children: offer.title }), _jsx("p", { className: "job-card__company", children: offer.hotel.name }), _jsxs("div", { className: "job-card__meta", children: [_jsx("span", { children: "\uD83D\uDCCD Paris" }), _jsxs("span", { children: ["\uD83D\uDCBC ", offer.requiredExperience, " ans exp."] })] }), _jsxs("div", { className: "job-card__actions", children: [_jsx("button", { className: "btn btn--ghost btn--sm", onClick: () => setViewingOffer(offer), children: "D\u00E9tails" }), _jsx("button", { className: "btn btn--primary btn--sm", onClick: () => setApplyingOffer(offer), disabled: appliedIds.has(offer.id), children: appliedIds.has(offer.id) ? 'Déjà postulé' : 'Postuler' })] })] })] }, offer.id))) }))] }), viewingOffer && (_jsx("div", { className: "modal-overlay", onClick: () => setViewingOffer(null), children: _jsxs("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "modal__header", children: [_jsxs("h2", { className: "modal__title", children: ["\uD83C\uDFE8 ", viewingOffer.title] }), _jsx("button", { className: "card__close", onClick: () => setViewingOffer(null), children: "\u2715" })] }), _jsxs("div", { className: "offer-details", children: [_jsxs("p", { className: "offer-details__company", children: [_jsx("strong", { children: "H\u00F4tel:" }), " ", viewingOffer.hotel.name] }), _jsxs("p", { className: "offer-details__experience", children: [_jsx("strong", { children: "Exp\u00E9rience:" }), " ", viewingOffer.requiredExperience, " ans"] }), viewingOffer.description && (_jsxs("div", { className: "offer-details__description", children: [_jsx("strong", { children: "Description:" }), _jsx("p", { children: viewingOffer.description })] }))] }), _jsxs("div", { className: "modal__actions", children: [_jsx("button", { className: "btn btn--ghost", onClick: () => setViewingOffer(null), children: "Fermer" }), _jsx("button", { className: "btn btn--primary", onClick: () => setApplyingOffer(viewingOffer), disabled: appliedIds.has(viewingOffer.id), children: appliedIds.has(viewingOffer.id) ? 'Déjà postulé' : 'Postuler' })] })] }) })), applyingOffer && (_jsx("div", { className: "modal-overlay", onClick: () => setApplyingOffer(null), children: _jsxs("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "modal__header", children: [_jsx("h2", { className: "modal__title", children: "\uD83D\uDCDD Candidature" }), _jsx("button", { className: "card__close", onClick: () => setApplyingOffer(null), children: "\u2715" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Poste cibl\u00E9" }), _jsxs("div", { className: "form-input form-input--readonly", children: [applyingOffer.title, " \u00B7 ", applyingOffer.hotel.name] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Lettre de motivation (optionnelle)" }), _jsx("textarea", { className: "form-input", rows: 5, placeholder: "D\u00E9crivez bri\u00E8vement votre motivation...", value: coverLetter, onChange: (event) => setCoverLetter(event.target.value) })] }), _jsxs("div", { className: "modal__actions", children: [_jsx("button", { className: "btn btn--ghost", onClick: () => setApplyingOffer(null), children: "Annuler" }), _jsx("button", { className: "btn btn--primary", onClick: () => applyMutation.mutate({
                                        offerId: applyingOffer.id,
                                        coverLetter,
                                    }), disabled: applyMutation.isPending, children: applyMutation.isPending ? 'Envoi...' : 'Envoyer' })] })] }) })), _jsx(Toast, { message: toast.message, type: toast.type })] }));
};
