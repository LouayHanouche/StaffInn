import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Toast } from '../components/Toast';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
export const HotelDashboard = () => {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState({
        message: null,
        type: 'ok',
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [viewingApplication, setViewingApplication] = useState(null);
    const offersQuery = useQuery({
        queryKey: ['hotel-offers'],
        queryFn: () => api.get('/offers'),
        refetchInterval: 15_000,
    });
    const applicationsQuery = useQuery({
        queryKey: ['hotel-applications'],
        queryFn: () => api.get('/hotel/applications'),
        refetchInterval: 15_000,
    });
    const createOfferMutation = useMutation({
        mutationFn: (payload) => api.post('/offers', payload),
        onSuccess: async () => {
            setToast({ message: 'Offre soumise pour modération', type: 'ok' });
            await queryClient.invalidateQueries({ queryKey: ['hotel-offers'] });
            setShowCreateForm(false);
        },
        onError: () => setToast({ message: 'Échec de la création', type: 'error' }),
    });
    const updateOfferMutation = useMutation({
        mutationFn: (payload) => api.put(`/offers/${payload.id}`, payload),
        onSuccess: async () => {
            setToast({ message: 'Offre mise à jour', type: 'ok' });
            await queryClient.invalidateQueries({ queryKey: ['hotel-offers'] });
            setEditingOffer(null);
        },
        onError: () => setToast({ message: 'Échec de la mise à jour', type: 'error' }),
    });
    const deleteOfferMutation = useMutation({
        mutationFn: (id) => api.delete(`/offers/${id}`),
        onSuccess: async () => {
            setToast({ message: 'Offre supprimée', type: 'ok' });
            await queryClient.invalidateQueries({ queryKey: ['hotel-offers'] });
        },
        onError: () => setToast({ message: 'Impossible de supprimer', type: 'error' }),
    });
    const onCreateOffer = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await createOfferMutation.mutateAsync({
            title: String(formData.get('title') ?? ''),
            description: String(formData.get('description') ?? ''),
            requiredSkills: String(formData.get('requiredSkills') ?? '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            requiredExperience: Number(formData.get('requiredExperience') ?? 0),
        });
    };
    const onUpdateOffer = async (event) => {
        event.preventDefault();
        if (!editingOffer)
            return;
        const formData = new FormData(event.currentTarget);
        await updateOfferMutation.mutateAsync({
            id: editingOffer.id,
            title: String(formData.get('title') ?? ''),
            description: String(formData.get('description') ?? ''),
            requiredSkills: String(formData.get('requiredSkills') ?? '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            requiredExperience: Number(formData.get('requiredExperience') ?? 0),
        });
    };
    const offers = offersQuery.data?.items ?? [];
    const applications = applicationsQuery.data?.items ?? [];
    const activeOffers = offers.filter((o) => o.status === 'ACTIVE').length;
    const totalApplications = applications.length;
    const recentApplications = applications.slice(0, 5);
    const tableColumns = [
        {
            key: 'title',
            header: 'Poste',
            render: (o) => _jsx("strong", { style: { color: 'var(--color-text)' }, children: o.title }),
        },
        {
            key: 'status',
            header: 'Statut',
            render: (o) => (_jsx("span", { className: `status-pill ${o.status === 'ACTIVE' ? 'status-pill--active' : o.status === 'PENDING' ? 'status-pill--pending' : 'status-pill--rejected'}`, children: o.status === 'ACTIVE' ? 'Actif' : o.status === 'PENDING' ? 'En attente' : 'Fermé' })),
        },
        {
            key: 'applications',
            header: 'Candidatures',
            render: (o) => o._count?.applications ?? 0,
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (o) => (_jsxs("div", { className: "action-btns", children: [_jsx("button", { className: "action-btn action-btn--edit", onClick: () => setEditingOffer(o), children: "Modifier" }), _jsx("button", { className: "action-btn action-btn--delete", onClick: () => deleteOfferMutation.mutate(o.id), children: "Supprimer" })] })),
        },
    ];
    return (_jsxs(DashboardLayout, { title: "Tableau de Bord Recruteur", children: [_jsxs("div", { className: "stats-row", children: [_jsxs("div", { className: "stats-row__group", children: [_jsx(StatCard, { label: "Offres Actives", value: activeOffers, variant: "dark" }), _jsx(StatCard, { label: "Candidatures Re\u00E7ues", value: totalApplications })] }), _jsxs("div", { className: "stats-row__actions", children: [_jsx("button", { className: "btn btn--primary", onClick: () => setShowCreateForm(true), children: "\u2728 Publier une Offre" }), _jsx(Link, { to: "/cv-database", className: "btn btn--primary", children: "\uD83D\uDC65 Voir Candidats" })] })] }), showCreateForm && (_jsx("div", { className: "modal-overlay", onClick: () => setShowCreateForm(false), children: _jsxs("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "modal__header", children: [_jsx("h2", { className: "modal__title", children: "\u2728 Nouvelle Offre" }), _jsx("button", { className: "card__close", onClick: () => setShowCreateForm(false), children: "\u2715" })] }), _jsxs("form", { onSubmit: onCreateOffer, children: [_jsxs("div", { className: "grid-2", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Titre du poste" }), _jsx("input", { name: "title", className: "form-input", required: true, minLength: 3, placeholder: "Ex: R\u00E9ceptionniste" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Exp\u00E9rience requise (ann\u00E9es)" }), _jsx("input", { name: "requiredExperience", type: "number", className: "form-input", min: 0, max: 30, defaultValue: 0, required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Description du poste" }), _jsx("textarea", { name: "description", className: "form-input", required: true, minLength: 20, rows: 4, placeholder: "D\u00E9crivez les responsabilit\u00E9s, horaires, avantages..." })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Comp\u00E9tences requises" }), _jsx("input", { name: "requiredSkills", className: "form-input", placeholder: "r\u00E9ception, anglais, service client (s\u00E9par\u00E9s par virgule)", required: true })] }), _jsxs("div", { style: { display: 'flex', gap: 12, marginTop: 8 }, children: [_jsx("button", { type: "submit", className: "btn btn--primary", children: "\uD83D\uDE80 Publier l'offre" }), _jsx("button", { type: "button", className: "btn btn--outline", onClick: () => setShowCreateForm(false), children: "Annuler" })] })] })] }) })), editingOffer && (_jsx("div", { className: "modal-overlay", onClick: () => setEditingOffer(null), children: _jsxs("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "modal__header", children: [_jsx("h2", { className: "modal__title", children: "\u270F\uFE0F Modifier l'Offre" }), _jsx("button", { className: "card__close", onClick: () => setEditingOffer(null), children: "\u2715" })] }), _jsxs("form", { onSubmit: onUpdateOffer, children: [_jsxs("div", { className: "grid-2", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Titre du poste" }), _jsx("input", { name: "title", className: "form-input", required: true, minLength: 3, defaultValue: editingOffer.title })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Exp\u00E9rience requise (ann\u00E9es)" }), _jsx("input", { name: "requiredExperience", type: "number", className: "form-input", min: 0, max: 30, defaultValue: editingOffer.requiredExperience, required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Description du poste" }), _jsx("textarea", { name: "description", className: "form-input", required: true, minLength: 20, rows: 4, defaultValue: editingOffer.description })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Comp\u00E9tences requises" }), _jsx("input", { name: "requiredSkills", className: "form-input", defaultValue: editingOffer.requiredSkills?.join(', ') ?? '', required: true })] }), _jsxs("div", { style: { display: 'flex', gap: 12, marginTop: 8 }, children: [_jsx("button", { type: "submit", className: "btn btn--primary", children: "\uD83D\uDCBE Enregistrer" }), _jsx("button", { type: "button", className: "btn btn--outline", onClick: () => setEditingOffer(null), children: "Annuler" })] })] })] }) })), viewingApplication && (_jsx("div", { className: "modal-overlay", onClick: () => setViewingApplication(null), children: _jsxs("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "modal__header", children: [_jsx("h2", { className: "modal__title", children: "\uD83D\uDC64 Profil du Candidat" }), _jsx("button", { className: "card__close", onClick: () => setViewingApplication(null), children: "\u2715" })] }), _jsxs("div", { className: "profile-card", children: [_jsx("div", { className: "profile-card__avatar", children: viewingApplication.candidate.fullName?.[0] ??
                                        (viewingApplication.candidate.email[0]?.toUpperCase() ?? '?') }), _jsx("h3", { className: "profile-card__name", children: viewingApplication.candidate.fullName ?? viewingApplication.candidate.email }), _jsxs("p", { className: "profile-card__subtitle", children: ["Candidature pour: ", viewingApplication.jobOffer.title] }), _jsxs("p", { className: "profile-card__subtitle", style: { marginTop: 8 }, children: ["Statut:", ' ', _jsx("span", { className: `status-pill ${viewingApplication.status === 'PENDING' ? 'status-pill--pending' : viewingApplication.status === 'INTERVIEW' ? 'status-pill--active' : 'status-pill--rejected'}`, children: viewingApplication.status === 'PENDING'
                                                ? 'En attente'
                                                : viewingApplication.status === 'INTERVIEW'
                                                    ? 'Entretien'
                                                    : 'Refusé' })] })] }), _jsx("div", { style: { display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }, children: _jsx("button", { className: "btn btn--primary", onClick: () => setViewingApplication(null), children: "Fermer" }) })] }) })), _jsxs("div", { className: "grid-2", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "card__header", children: _jsx("h2", { className: "card__title", children: "\uD83D\uDCCB Liste des Offres" }) }), offers.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state__icon", children: "\uD83D\uDCED" }), _jsx("p", { className: "empty-state__text", children: "Aucune offre publi\u00E9e" })] })) : (_jsx(DataTable, { columns: tableColumns, data: offers, keyExtractor: (o) => o.id }))] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card__header", children: _jsx("h2", { className: "card__title", children: "\uD83D\uDD14 Candidatures R\u00E9centes" }) }), recentApplications.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state__icon", children: "\uD83D\uDCED" }), _jsx("p", { className: "empty-state__text", children: "Aucune candidature re\u00E7ue" })] })) : (_jsx("div", { className: "notification-list", children: recentApplications.map((app) => (_jsxs("div", { className: "notification-item", children: [_jsx("div", { className: "notification-item__icon notification-item__icon--info", children: "\uD83D\uDC64" }), _jsxs("div", { className: "notification-item__content", children: [_jsxs("p", { className: "notification-item__text", children: [_jsx("strong", { children: app.candidate.fullName ?? app.candidate.email }), " a postul\u00E9 pour ", _jsx("strong", { children: app.jobOffer.title })] }), _jsxs("span", { className: "notification-item__time", children: ["Statut:", ' ', app.status === 'PENDING'
                                                            ? 'En attente'
                                                            : app.status === 'INTERVIEW'
                                                                ? 'Entretien'
                                                                : 'Refusé'] })] }), _jsx("button", { className: "action-btn action-btn--view", onClick: () => setViewingApplication(app), children: "Voir Profil" })] }, app.id))) }))] })] }), _jsx(Toast, { message: toast.message, type: toast.type })] }));
};
