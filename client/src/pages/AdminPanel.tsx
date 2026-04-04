import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { DataTable } from '../components/DataTable';
import { StatCard } from '../components/StatCard';
import { api } from '../lib/api';

interface UserItem {
  id: string;
  email: string;
  role: 'HOTEL' | 'CANDIDATE' | 'ADMIN';
  isActive: boolean;
}

interface OfferItem {
  id: string;
  title: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED';
  hotel?: {
    email: string;
  };
}

const roleLabels: Record<string, string> = {
  HOTEL: 'Hôtel',
  CANDIDATE: 'Candidat',
  ADMIN: 'Admin',
};

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Active',
  CLOSED: 'Fermée',
};

export const AdminPanel = () => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<{ items: UserItem[] }>('/admin/users?page=1&pageSize=50'),
    refetchInterval: 15_000,
  });

  const offersQuery = useQuery({
    queryKey: ['admin-offers'],
    queryFn: () => api.get<{ items: OfferItem[] }>('/admin/offers?page=1&pageSize=50'),
    refetchInterval: 15_000,
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload: { id: string; isActive: boolean }) =>
      api.put(`/admin/users/${payload.id}`, { isActive: payload.isActive }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const moderateOfferMutation = useMutation({
    mutationFn: (payload: { id: string; action: 'approve' | 'reject' | 'close' }) =>
      api.put(`/admin/offers/${payload.id}`, { action: payload.action }),
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
    { key: 'email' as const, header: 'Email' },
    {
      key: 'role' as const,
      header: 'Rôle',
      render: (user: UserItem) => (
        <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>
          {roleLabels[user.role] ?? user.role}
        </span>
      ),
    },
    {
      key: 'isActive' as const,
      header: 'Statut',
      render: (user: UserItem) => (
        <span className={`status-pill status-pill--${user.isActive ? 'active' : 'rejected'}`}>
          {user.isActive ? 'Actif' : 'Suspendu'}
        </span>
      ),
    },
    {
      key: 'id' as const,
      header: 'Actions',
      render: (user: UserItem) => (
        <button
          type="button"
          className={`btn btn--sm ${user.isActive ? 'btn--outline btn--danger' : 'btn--primary'}`}
          onClick={() => updateUserMutation.mutate({ id: user.id, isActive: !user.isActive })}
          disabled={updateUserMutation.isPending}
        >
          {user.isActive ? 'Suspendre' : 'Activer'}
        </button>
      ),
    },
  ];

  const offerColumns = [
    { key: 'title' as const, header: 'Titre' },
    {
      key: 'hotel' as const,
      header: 'Hôtel',
      render: (offer: OfferItem) => offer.hotel?.email ?? '—',
    },
    {
      key: 'status' as const,
      header: 'Statut',
      render: (offer: OfferItem) => {
        const statusClass =
          offer.status === 'ACTIVE' ? 'active' : offer.status === 'PENDING' ? 'pending' : 'rejected';
        return (
          <span className={`status-pill status-pill--${statusClass}`}>
            {statusLabels[offer.status] ?? offer.status}
          </span>
        );
      },
    },
    {
      key: 'id' as const,
      header: 'Actions',
      render: (offer: OfferItem) => (
        <div className="action-btn-group">
          {offer.status === 'PENDING' && (
            <>
              <button
                type="button"
                className="btn btn--sm btn--primary"
                onClick={() => moderateOfferMutation.mutate({ id: offer.id, action: 'approve' })}
                disabled={moderateOfferMutation.isPending}
              >
                Valider
              </button>
              <button
                type="button"
                className="btn btn--sm btn--outline btn--danger"
                onClick={() => moderateOfferMutation.mutate({ id: offer.id, action: 'reject' })}
                disabled={moderateOfferMutation.isPending}
              >
                Rejeter
              </button>
            </>
          )}
          {offer.status === 'ACTIVE' && (
            <button
              type="button"
              className="btn btn--sm btn--outline"
              onClick={() => moderateOfferMutation.mutate({ id: offer.id, action: 'close' })}
              disabled={moderateOfferMutation.isPending}
            >
              Fermer
            </button>
          )}
          {offer.status === 'CLOSED' && <span className="text-muted">—</span>}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Administration">
      <div className="stats-row">
        <StatCard label="Utilisateurs Actifs" value={activeUsers} variant="dark" />
        <StatCard label="Utilisateurs Suspendus" value={suspendedUsers} />
        <StatCard label="Offres en Attente" value={pendingOffers} variant="dark" />
        <StatCard label="Offres Actives" value={activeOffers} />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Gestion des Utilisateurs</h3>
          </div>
          {usersQuery.isLoading ? (
            <div className="loading-state">Chargement...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">Aucun utilisateur trouvé</div>
          ) : (
            <DataTable columns={userColumns} data={users} keyExtractor={(user) => user.id} />
          )}
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Modération des Offres</h3>
          </div>
          {offersQuery.isLoading ? (
            <div className="loading-state">Chargement...</div>
          ) : offers.length === 0 ? (
            <div className="empty-state">Aucune offre à modérer</div>
          ) : (
            <DataTable columns={offerColumns} data={offers} keyExtractor={(offer) => offer.id} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
