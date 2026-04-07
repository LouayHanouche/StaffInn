import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { DataTable } from '../components/DataTable';
import { StatCard } from '../components/StatCard';
import { Toast } from '../components/Toast';
import { ApiError, api } from '../lib/api';

interface UserItem {
  id: string;
  email: string;
  role: 'HOTEL' | 'CANDIDATE' | 'ADMIN';
  isActive: boolean;
  candidateProfile?: {
    fullName: string;
    skills: string[];
    experienceYears: number;
    position: string;
  };
  hotelProfile?: {
    name: string;
    address?: string;
    description?: string;
  };
}

interface OfferItem {
  id: string;
  title: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED';
  hotel?: {
    name: string;
  };
}

type UserRole = 'HOTEL' | 'CANDIDATE' | 'ADMIN';

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

// === CreateUserModal Component ===
interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserModal = ({ onClose, onSuccess }: CreateUserModalProps): JSX.Element => {
  const [toast, setToast] = useState<{ message: string | null; type: 'ok' | 'error' }>({
    message: null,
    type: 'ok',
  });
  const [role, setRole] = useState<UserRole>('CANDIDATE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [fullName, setFullName] = useState('');

  const createUserMutation = useMutation({
    mutationFn: (payload: {
      role: UserRole;
      email: string;
      password: string;
      hotelName?: string;
      fullName?: string;
    }) => api.post('/admin/users', payload),
    onSuccess: () => {
      setToast({ message: 'Utilisateur créé avec succès', type: 'ok' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setToast({ message: error.message, type: 'error' });
        return;
      }
      setToast({ message: 'Erreur lors de la création', type: 'error' });
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const payload: {
      role: UserRole;
      email: string;
      password: string;
      hotelName?: string;
      fullName?: string;
    } = { role, email, password };

    if (role === 'HOTEL') {
      payload.hotelName = hotelName;
    } else if (role === 'CANDIDATE') {
      payload.fullName = fullName;
    }

    createUserMutation.mutate(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Créer un utilisateur</h2>
          <button className="card__close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="create-user-role">
              Rôle
            </label>
            <select
              id="create-user-role"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="CANDIDATE">Candidat</option>
              <option value="HOTEL">Hôtel</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="create-user-email">
              Email
            </label>
            <input
              id="create-user-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="create-user-password">
              Mot de passe
            </label>
            <input
              id="create-user-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={10}
            />
            <small className="form-hint">
              Min. 10 caractères, une majuscule, une minuscule, un chiffre
            </small>
          </div>

          {role === 'HOTEL' && (
            <div className="form-group">
              <label className="form-label" htmlFor="create-user-hotel-name">
                Nom de l'hôtel
              </label>
              <input
                id="create-user-hotel-name"
                type="text"
                className="form-input"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}

          {role === 'CANDIDATE' && (
            <div className="form-group">
              <label className="form-label" htmlFor="create-user-full-name">
                Nom complet
              </label>
              <input
                id="create-user-full-name"
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}

          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={onClose} type="button">
              Annuler
            </button>
            <button className="btn btn--primary" type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
        <Toast message={toast.message} type={toast.type} />
      </div>
    </div>
  );
};

// === EditUserDrawer Component ===
interface EditUserDrawerProps {
  user: UserItem;
  onClose: () => void;
  onSuccess: () => void;
}

const EditUserDrawer = ({ user, onClose, onSuccess }: EditUserDrawerProps): JSX.Element => {
  const [toast, setToast] = useState<{ message: string | null; type: 'ok' | 'error' }>({
    message: null,
    type: 'ok',
  });

  // Candidate profile fields
  const [fullName, setFullName] = useState(user.candidateProfile?.fullName ?? '');
  const [skills, setSkills] = useState(user.candidateProfile?.skills?.join(', ') ?? '');
  const [experienceYears, setExperienceYears] = useState(user.candidateProfile?.experienceYears ?? 0);
  const [position, setPosition] = useState(user.candidateProfile?.position ?? '');

  // Hotel profile fields
  const [hotelName, setHotelName] = useState(user.hotelProfile?.name ?? '');
  const [hotelAddress, setHotelAddress] = useState(user.hotelProfile?.address ?? '');
  const [hotelDescription, setHotelDescription] = useState(user.hotelProfile?.description ?? '');

  const updateProfileMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.patch(`/admin/users/${user.id}/profile`, payload),
    onSuccess: () => {
      setToast({ message: 'Profil mis à jour', type: 'ok' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setToast({ message: error.message, type: 'error' });
        return;
      }
      setToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (user.role === 'CANDIDATE') {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      updateProfileMutation.mutate({
        fullName: fullName.trim() || undefined,
        skills: skillsArray.length > 0 ? skillsArray : undefined,
        experienceYears: experienceYears > 0 ? experienceYears : undefined,
        position: position.trim() || undefined,
      });
    } else if (user.role === 'HOTEL') {
      updateProfileMutation.mutate({
        name: hotelName.trim() || undefined,
        address: hotelAddress.trim() || undefined,
        description: hotelDescription.trim() || undefined,
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--drawer" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Modifier le profil</h2>
          <button className="card__close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="drawer-info">
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Rôle:</strong> {roleLabels[user.role] ?? user.role}
          </p>
        </div>

        {user.role === 'ADMIN' ? (
          <div className="empty-state">
            <p>Les profils admin ne peuvent pas être modifiés ici.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {user.role === 'CANDIDATE' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-full-name">
                    Nom complet
                  </label>
                  <input
                    id="edit-full-name"
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-position">
                    Poste
                  </label>
                  <input
                    id="edit-position"
                    type="text"
                    className="form-input"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-skills">
                    Compétences (séparées par virgule)
                  </label>
                  <input
                    id="edit-skills"
                    type="text"
                    className="form-input"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-experience">
                    Années d'expérience
                  </label>
                  <input
                    id="edit-experience"
                    type="number"
                    min={0}
                    max={60}
                    className="form-input"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                  />
                </div>
              </>
            )}

            {user.role === 'HOTEL' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-hotel-name">
                    Nom de l'hôtel
                  </label>
                  <input
                    id="edit-hotel-name"
                    type="text"
                    className="form-input"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-hotel-address">
                    Adresse
                  </label>
                  <input
                    id="edit-hotel-address"
                    type="text"
                    className="form-input"
                    value={hotelAddress}
                    onChange={(e) => setHotelAddress(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-hotel-description">
                    Description
                  </label>
                  <textarea
                    id="edit-hotel-description"
                    className="form-input"
                    rows={4}
                    value={hotelDescription}
                    onChange={(e) => setHotelDescription(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={onClose} type="button">
                Annuler
              </button>
              <button
                className="btn btn--primary"
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}
        <Toast message={toast.message} type={toast.type} />
      </div>
    </div>
  );
};

// === OfferReviewModal Component ===
interface OfferReviewModalProps {
  offer: OfferItem;
  action: 'approve' | 'reject' | 'close';
  onClose: () => void;
  onSuccess: () => void;
}

const OfferReviewModal = ({ offer, action, onClose, onSuccess }: OfferReviewModalProps): JSX.Element => {
  const [toast, setToast] = useState<{ message: string | null; type: 'ok' | 'error' }>({
    message: null,
    type: 'ok',
  });
  const [reason, setReason] = useState('');

  const actionLabels: Record<'approve' | 'reject' | 'close', string> = {
    approve: 'Valider',
    reject: 'Rejeter',
    close: 'Fermer',
  };

  const moderateMutation = useMutation({
    mutationFn: (payload: { action: 'approve' | 'reject' | 'close'; reason?: string }) =>
      api.put(`/admin/offers/${offer.id}`, payload),
    onSuccess: () => {
      const label = actionLabels[action];
      setToast({ message: `Offre ${label.toLowerCase()}ée`, type: 'ok' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setToast({ message: error.message, type: 'error' });
        return;
      }
      setToast({ message: 'Erreur lors de la modération', type: 'error' });
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    moderateMutation.mutate({
      action,
      reason: reason.trim() || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{actionLabels[action]} l'offre</h2>
          <button className="card__close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="drawer-info">
          <p>
            <strong>Titre:</strong> {offer.title}
          </p>
          <p>
            <strong>Hôtel:</strong> {offer.hotel?.name ?? '—'}
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="moderation-reason">
              Raison {action === 'approve' ? '(optionnelle)' : ''}
            </label>
            <textarea
              id="moderation-reason"
              className="form-input"
              rows={4}
              placeholder={
                action === 'reject'
                  ? "Expliquez pourquoi l'offre est rejetée..."
                  : action === 'close'
                    ? "Raison de la fermeture..."
                    : 'Commentaire optionnel...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={onClose} type="button">
              Annuler
            </button>
            <button
              className={`btn ${action === 'approve' ? 'btn--primary' : 'btn--danger'}`}
              type="submit"
              disabled={moderateMutation.isPending}
            >
              {moderateMutation.isPending ? 'En cours...' : actionLabels[action]}
            </button>
          </div>
        </form>
        <Toast message={toast.message} type={toast.type} />
      </div>
    </div>
  );
};

export const AdminPanel = () => {
  const queryClient = useQueryClient();

  // Modal states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [reviewingOffer, setReviewingOffer] = useState<{
    offer: OfferItem;
    action: 'approve' | 'reject' | 'close';
  } | null>(null);

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

  const handleRefreshUsers = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const handleRefreshOffers = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
  };

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
        <div className="action-btn-group">
          {user.role !== 'ADMIN' && (
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => setEditingUser(user)}
            >
              Modifier
            </button>
          )}
          <button
            type="button"
            className={`btn btn--sm ${user.isActive ? 'btn--outline btn--danger' : 'btn--primary'}`}
            onClick={() => updateUserMutation.mutate({ id: user.id, isActive: !user.isActive })}
            disabled={updateUserMutation.isPending}
          >
            {user.isActive ? 'Suspendre' : 'Activer'}
          </button>
        </div>
      ),
    },
  ];

  const offerColumns = [
    { key: 'title' as const, header: 'Titre' },
    {
      key: 'hotel' as const,
      header: 'Hôtel',
      render: (offer: OfferItem) => offer.hotel?.name ?? '—',
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
                onClick={() => setReviewingOffer({ offer, action: 'approve' })}
              >
                Valider
              </button>
              <button
                type="button"
                className="btn btn--sm btn--outline btn--danger"
                onClick={() => setReviewingOffer({ offer, action: 'reject' })}
              >
                Rejeter
              </button>
            </>
          )}
          {offer.status === 'ACTIVE' && (
            <button
              type="button"
              className="btn btn--sm btn--outline"
              onClick={() => setReviewingOffer({ offer, action: 'close' })}
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
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setShowCreateUserModal(true)}
            >
              + Créer
            </button>
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

      {showCreateUserModal && (
        <CreateUserModal
          onClose={() => setShowCreateUserModal(false)}
          onSuccess={handleRefreshUsers}
        />
      )}

      {editingUser && (
        <EditUserDrawer
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleRefreshUsers}
        />
      )}

      {reviewingOffer && (
        <OfferReviewModal
          offer={reviewingOffer.offer}
          action={reviewingOffer.action}
          onClose={() => setReviewingOffer(null)}
          onSuccess={handleRefreshOffers}
        />
      )}
    </DashboardLayout>
  );
};
