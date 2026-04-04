import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { DataTable } from '../components/DataTable';
import { StatCard } from '../components/StatCard';
import { api } from '../lib/api';
const roleLabels = {
    HOTEL: 'Hôtel',
    CANDIDATE: 'Candidat',
    ADMIN: 'Admin',
};
const statusLabels = {
    PENDING: 'En attente',
    ACTIVE: 'Active',
    CLOSED: 'Fermée',
};
export const AdminPanel = () => {
    const queryClient = useQueryClient();
    const usersQuery = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => api.get('/admin/users?page=1&pageSize=50'),
        refetchInterval: 15_000,
    });
    const offersQuery = useQuery({
        queryKey: ['admin-offers'],
        queryFn: () => api.get('/admin/offers?page=1&pageSize=50'),
        refetchInterval: 15_000,
    });
    const updateUserMutation = useMutation({
        mutationFn: (payload) => api.put(`/admin/users/${payload.id}`, { isActive: payload.isActive }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });
    const moderateOfferMutation = useMutation({
        mutationFn: (payload) => api.put(`/admin/offers/${payload.id}`, { action: payload.action }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
        },
    });
    const users = usersQuery.data?.items ?? [];
    const offers = offersQuery.data?.items ?? [];
    const activeUsers = users.filter((u) => u.isActive).length;
    const suspendedUsers = users.filter((u) => !u.isActive).length;
    const pendingOffers = offers.filter((o) => o.status === 'PENDING').length;
    const activeOffers = offers.filter((o) => o.status === 'ACTIVE').length;
    const userColumns = [
        { key: 'email', header: 'Email' },
        {
            key: 'role',
            header: 'Rôle',
            render: (user) => (_jsx("span", { className: `role-badge role-badge--${user.role.toLowerCase()}`, children: roleLabels[user.role] ?? user.role })),
        },
        {
            key: 'isActive',
            header: 'Statut',
            render: (user) => (_jsx("span", { className: `status-pill status-pill--${user.isActive ? 'active' : 'rejected'}`, children: user.isActive ? 'Actif' : 'Suspendu' })),
        },
        {
            key: 'id',
            header: 'Actions',
            render: (user) => (_jsx("button", { type: "button", className: `btn btn--sm ${user.isActive ? 'btn--outline btn--danger' : 'btn--primary'}`, onClick: () => updateUserMutation.mutate({ id: user.id, isActive: !user.isActive }), disabled: updateUserMutation.isPending, children: user.isActive ? 'Suspendre' : 'Activer' })),
        },
    ];
    const offerColumns = [
        { key: 'title', header: 'Titre' },
        {
            key: 'hotel',
            header: 'Hôtel',
            render: (offer) => offer.hotel?.email ?? '—',
        },
        {
            key: 'status',
            header: 'Statut',
            render: (offer) => {
                const statusClass = offer.status === 'ACTIVE' ? 'active' : offer.status === 'PENDING' ? 'pending' : 'rejected';
                return (_jsx("span", { className: `status-pill status-pill--${statusClass}`, children: statusLabels[offer.status] ?? offer.status }));
            },
        },
        {
            key: 'id',
            header: 'Actions',
            render: (offer) => (_jsxs("div", { className: "action-btn-group", children: [offer.status === 'PENDING' && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--sm btn--primary", onClick: () => moderateOfferMutation.mutate({ id: offer.id, action: 'approve' }), disabled: moderateOfferMutation.isPending, children: "Valider" }), _jsx("button", { type: "button", className: "btn btn--sm btn--outline btn--danger", onClick: () => moderateOfferMutation.mutate({ id: offer.id, action: 'reject' }), disabled: moderateOfferMutation.isPending, children: "Rejeter" })] })), offer.status === 'ACTIVE' && (_jsx("button", { type: "button", className: "btn btn--sm btn--outline", onClick: () => moderateOfferMutation.mutate({ id: offer.id, action: 'close' }), disabled: moderateOfferMutation.isPending, children: "Fermer" })), offer.status === 'CLOSED' && _jsx("span", { className: "text-muted", children: "\u2014" })] })),
        },
    ];
    return (_jsxs(DashboardLayout, { title: "Administration", children: [_jsxs("div", { className: "stats-row", children: [_jsx(StatCard, { label: "Utilisateurs Actifs", value: activeUsers, variant: "dark" }), _jsx(StatCard, { label: "Utilisateurs Suspendus", value: suspendedUsers }), _jsx(StatCard, { label: "Offres en Attente", value: pendingOffers, variant: "dark" }), _jsx(StatCard, { label: "Offres Actives", value: activeOffers })] }), _jsxs("div", { className: "grid-2", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "card__header", children: _jsx("h3", { className: "card__title", children: "Gestion des Utilisateurs" }) }), usersQuery.isLoading ? (_jsx("div", { className: "loading-state", children: "Chargement..." })) : users.length === 0 ? (_jsx("div", { className: "empty-state", children: "Aucun utilisateur trouv\u00E9" })) : (_jsx(DataTable, { columns: userColumns, data: users, keyExtractor: (user) => user.id }))] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card__header", children: _jsx("h3", { className: "card__title", children: "Mod\u00E9ration des Offres" }) }), offersQuery.isLoading ? (_jsx("div", { className: "loading-state", children: "Chargement..." })) : offers.length === 0 ? (_jsx("div", { className: "empty-state", children: "Aucune offre \u00E0 mod\u00E9rer" })) : (_jsx(DataTable, { columns: offerColumns, data: offers, keyExtractor: (offer) => offer.id }))] })] })] }));
};
