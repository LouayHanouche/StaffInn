import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { ApiError, api } from '../lib/api';
import { Toast } from '../components/Toast';
const experienceOptions = [
    { value: 'all', label: 'Toutes' },
    { value: '0-2', label: '0-2 ans' },
    { value: '3-5', label: '3-5 ans' },
    { value: '5+', label: '5+ ans' },
];
const positionOptions = [
    { value: '', label: 'Tous les postes' },
    { value: 'receptionniste', label: 'Réceptionniste' },
    { value: 'concierge', label: 'Concierge' },
    { value: 'serveur', label: 'Serveur/Serveuse' },
    { value: 'cuisinier', label: 'Cuisinier' },
    { value: 'femme_chambre', label: 'Femme de chambre' },
    { value: 'manager', label: 'Manager' },
];
function getInitials(fullName, email) {
    if (fullName) {
        const parts = fullName.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
        }
        return parts[0]?.[0]?.toUpperCase() ?? '??';
    }
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }
    return '??';
}
function matchesExperienceFilter(years, filter) {
    if (filter === 'all')
        return true;
    if (years === undefined)
        return filter === '0-2';
    if (filter === '0-2')
        return years <= 2;
    if (filter === '3-5')
        return years >= 3 && years <= 5;
    return years > 5;
}
export const CVDatabase = () => {
    const [experienceFilter, setExperienceFilter] = useState('all');
    const [positionFilter, setPositionFilter] = useState('');
    const [skillsFilter, setSkillsFilter] = useState('');
    const [viewingCandidate, setViewingCandidate] = useState(null);
    const [recruitingCandidate, setRecruitingCandidate] = useState(null);
    const [selectedOfferId, setSelectedOfferId] = useState('');
    const [recruitStatus, setRecruitStatus] = useState('INTERVIEW');
    const [recruitToast, setRecruitToast] = useState({
        message: null,
        type: 'ok',
    });
    const candidatesQuery = useQuery({
        queryKey: ['cv-database'],
        queryFn: () => api.get('/candidates?page=1&pageSize=100'),
        refetchInterval: 30_000,
    });
    const offersQuery = useQuery({
        queryKey: ['hotel-offers'],
        queryFn: () => api.get('/offers'),
        refetchInterval: 30_000,
    });
    const candidates = candidatesQuery.data?.items ?? [];
    const offers = (offersQuery.data?.items ?? []).filter((offer) => offer.title);
    const activeOffers = offers.filter((offer) => offer.status === 'ACTIVE');
    const filteredCandidates = candidates.filter((candidate) => {
        if (!matchesExperienceFilter(candidate.experienceYears, experienceFilter)) {
            return false;
        }
        if (positionFilter && candidate.position?.toLowerCase() !== positionFilter) {
            return false;
        }
        if (skillsFilter) {
            const searchTerms = skillsFilter
                .toLowerCase()
                .split(',')
                .map((s) => s.trim());
            const candidateSkills = (candidate.skills ?? []).map((s) => s.toLowerCase());
            const hasMatchingSkill = searchTerms.some((term) => candidateSkills.some((skill) => skill.includes(term)));
            if (!hasMatchingSkill)
                return false;
        }
        return true;
    });
    return (_jsxs(DashboardLayout, { title: "Base de Candidats", children: [_jsxs("div", { className: "cv-database-layout", children: [_jsxs("aside", { className: "filter-panel", children: [_jsx("h3", { className: "filter-panel__title", children: "\uD83D\uDD0D Filtres" }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { className: "filter-group__label", htmlFor: "experience-filter", children: "Exp\u00E9rience" }), _jsx("select", { id: "experience-filter", className: "filter-group__select", value: experienceFilter, onChange: (e) => setExperienceFilter(e.target.value), children: experienceOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { className: "filter-group__label", htmlFor: "position-filter", children: "Poste recherch\u00E9" }), _jsx("select", { id: "position-filter", className: "filter-group__select", value: positionFilter, onChange: (e) => setPositionFilter(e.target.value), children: positionOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { className: "filter-group__label", htmlFor: "skills-filter", children: "Comp\u00E9tences" }), _jsx("input", { id: "skills-filter", type: "text", className: "filter-group__input", placeholder: "Ex: anglais, service...", value: skillsFilter, onChange: (e) => setSkillsFilter(e.target.value) })] }), _jsx("button", { type: "button", className: "btn btn--outline", style: { width: '100%' }, onClick: () => {
                                    setExperienceFilter('all');
                                    setPositionFilter('');
                                    setSkillsFilter('');
                                }, children: "R\u00E9initialiser" }), _jsxs("div", { className: "filter-stats", children: [_jsx("span", { className: "filter-stats__count", children: filteredCandidates.length }), _jsxs("span", { className: "filter-stats__label", children: ["candidat", filteredCandidates.length !== 1 ? 's' : '', " trouv\u00E9", filteredCandidates.length !== 1 ? 's' : ''] })] })] }), _jsx("div", { className: "cv-database-results", children: candidatesQuery.isLoading ? (_jsxs("div", { className: "loading-state", children: [_jsx("div", { className: "loading-spinner" }), _jsx("p", { children: "Chargement des candidats..." })] })) : filteredCandidates.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state__icon", children: "\uD83D\uDD0D" }), _jsx("p", { className: "empty-state__text", children: "Aucun candidat trouv\u00E9" }), _jsx("p", { className: "empty-state__subtext", children: "Essayez de modifier vos filtres" })] })) : (filteredCandidates.map((candidate) => (_jsxs("div", { className: "candidate-card", children: [_jsxs("div", { className: "candidate-card__header", children: [_jsx("div", { className: "candidate-card__avatar", children: getInitials(candidate.fullName, candidate.email) }), _jsxs("div", { className: "candidate-card__info", children: [_jsx("div", { className: "candidate-card__name", children: candidate.fullName ?? candidate.email }), _jsx("div", { className: "candidate-card__position", children: candidate.position ?? 'Poste non spécifié' })] }), _jsx("div", { className: "candidate-card__status", children: _jsx("span", { className: `status-pill status-pill--${candidate.isActive ? 'active' : 'rejected'}`, children: candidate.isActive ? 'Disponible' : 'Indisponible' }) })] }), _jsxs("div", { className: "candidate-card__details", children: [_jsxs("div", { className: "candidate-card__detail", children: [_jsx("span", { className: "candidate-card__detail-icon", children: "\uD83D\uDCE7" }), candidate.email] }), candidate.experienceYears !== undefined && (_jsxs("div", { className: "candidate-card__detail", children: [_jsx("span", { className: "candidate-card__detail-icon", children: "\uD83D\uDCBC" }), candidate.experienceYears, " ans d'exp\u00E9rience"] }))] }), candidate.skills && candidate.skills.length > 0 && (_jsxs("div", { className: "candidate-card__skills", children: [candidate.skills.slice(0, 5).map((skill, idx) => (_jsx("span", { className: "candidate-card__skill", children: skill }, idx))), candidate.skills.length > 5 && (_jsxs("span", { className: "candidate-card__skill candidate-card__skill--more", children: ["+", candidate.skills.length - 5] }))] })), _jsxs("div", { className: "candidate-card__actions", children: [_jsx("button", { type: "button", className: "btn btn--primary btn--sm", onClick: () => setViewingCandidate(candidate), children: "Voir Profil" }), _jsx("button", { type: "button", className: "btn btn--outline btn--sm", onClick: () => {
                                                setRecruitingCandidate(candidate);
                                                setSelectedOfferId('');
                                                setRecruitStatus('INTERVIEW');
                                            }, children: "Recruter" }), candidate.cvPath && (_jsx("a", { href: `/api${candidate.cvPath}`, target: "_blank", rel: "noopener noreferrer", className: "btn btn--outline btn--sm", children: "\uD83D\uDCC4 T\u00E9l\u00E9charger CV" }))] })] }, candidate.id)))) })] }), viewingCandidate && (_jsx("div", { className: "modal-overlay", onClick: () => setViewingCandidate(null), children: _jsxs("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "modal__header", children: [_jsx("h2", { className: "modal__title", children: "\uD83D\uDC64 Profil du Candidat" }), _jsx("button", { className: "card__close", onClick: () => setViewingCandidate(null), children: "\u2715" })] }), _jsxs("div", { className: "profile-card profile-card--modal", children: [_jsx("div", { className: "profile-card__avatar profile-card__avatar--large", children: getInitials(viewingCandidate.fullName, viewingCandidate.email) }), _jsx("h3", { className: "profile-card__name", children: viewingCandidate.fullName ?? viewingCandidate.email }), _jsx("p", { className: "profile-card__subtitle", children: viewingCandidate.position ?? 'Poste non spécifié' }), _jsxs("div", { className: "profile-details", children: [_jsxs("div", { className: "profile-detail", children: [_jsx("span", { className: "profile-detail__label", children: "\uD83D\uDCE7 Email" }), _jsx("span", { className: "profile-detail__value", children: viewingCandidate.email })] }), _jsxs("div", { className: "profile-detail", children: [_jsx("span", { className: "profile-detail__label", children: "\uD83D\uDCBC Exp\u00E9rience" }), _jsxs("span", { className: "profile-detail__value", children: [viewingCandidate.experienceYears ?? 0, " ans"] })] }), _jsxs("div", { className: "profile-detail", children: [_jsx("span", { className: "profile-detail__label", children: "\uD83D\uDD14 Disponibilit\u00E9" }), _jsx("span", { className: "profile-detail__value", children: _jsx("span", { className: `status-pill status-pill--${viewingCandidate.isActive ? 'active' : 'rejected'}`, children: viewingCandidate.isActive ? 'Disponible' : 'Indisponible' }) })] })] }), viewingCandidate.skills && viewingCandidate.skills.length > 0 && (_jsxs("div", { className: "profile-skills", children: [_jsx("span", { className: "profile-skills__label", children: "\uD83C\uDFAF Comp\u00E9tences" }), _jsx("div", { className: "skills-list", children: viewingCandidate.skills.map((skill, idx) => (_jsx("span", { className: "skill-tag", children: skill }, idx))) })] }))] }), _jsxs("div", { className: "modal__actions", children: [_jsx("button", { className: "btn btn--ghost", onClick: () => setViewingCandidate(null), children: "Fermer" }), viewingCandidate.cvPath && (_jsx("a", { href: `/api${viewingCandidate.cvPath}`, target: "_blank", rel: "noopener noreferrer", className: "btn btn--primary", children: "\uD83D\uDCC4 T\u00E9l\u00E9charger CV" }))] })] }) })), recruitingCandidate && (_jsx("div", { className: "modal-overlay", onClick: () => setRecruitingCandidate(null), children: _jsxs("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "modal__header", children: [_jsx("h2", { className: "modal__title", children: "\u2705 Recruter un candidat" }), _jsx("button", { className: "card__close", onClick: () => setRecruitingCandidate(null), children: "\u2715" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Candidat" }), _jsx("div", { className: "form-input form-input--readonly", children: recruitingCandidate.fullName ?? recruitingCandidate.email })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Offre" }), _jsxs("select", { className: "form-input", value: selectedOfferId, onChange: (event) => setSelectedOfferId(event.target.value), children: [_jsx("option", { value: "", children: "S\u00E9lectionner une offre" }), activeOffers.map((offer) => (_jsx("option", { value: offer.id, children: offer.title }, offer.id)))] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Statut" }), _jsxs("select", { className: "form-input", value: recruitStatus, onChange: (event) => setRecruitStatus(event.target.value), children: [_jsx("option", { value: "INTERVIEW", children: "Entretien" }), _jsx("option", { value: "ACCEPTED", children: "Accept\u00E9" })] })] }), _jsxs("div", { className: "modal__actions", children: [_jsx("button", { className: "btn btn--ghost", onClick: () => setRecruitingCandidate(null), children: "Annuler" }), _jsx("button", { className: "btn btn--primary", disabled: !selectedOfferId, onClick: async () => {
                                        if (!selectedOfferId)
                                            return;
                                        try {
                                            await api.post('/hotel/applications', {
                                                candidateId: recruitingCandidate.id,
                                                offerId: selectedOfferId,
                                                status: recruitStatus,
                                            });
                                            setRecruitToast({ message: 'Candidature créée', type: 'ok' });
                                            setRecruitingCandidate(null);
                                        }
                                        catch (error) {
                                            if (error instanceof ApiError) {
                                                setRecruitToast({ message: error.message, type: 'error' });
                                                return;
                                            }
                                            setRecruitToast({ message: 'Impossible de recruter ce candidat', type: 'error' });
                                        }
                                    }, children: "Confirmer" })] })] }) })), _jsx(Toast, { message: recruitToast.message, type: recruitToast.type })] }));
};
