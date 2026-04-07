import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Toast } from '../components/Toast';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';

interface Offer {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED';
  requiredExperience: number;
  requiredSkills: string[];
  _count?: { applications: number };
}

interface Application {
  id: string;
  status: string;
  candidate: {
    id: string;
    email: string;
    fullName?: string;
  };
  jobOffer: { title: string };
}

export const HotelDashboard = () => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string | null; type: 'ok' | 'error' }>({
    message: null,
    type: 'ok',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);

  const offersQuery = useQuery({
    queryKey: ['hotel-offers'],
    queryFn: () => api.get<{ items: Offer[] }>('/offers'),
    refetchInterval: 15_000,
  });

  const applicationsQuery = useQuery({
    queryKey: ['hotel-applications'],
    queryFn: () => api.get<{ items: Application[] }>('/hotel/applications'),
    refetchInterval: 15_000,
  });

  const createOfferMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description: string;
      requiredSkills: string[];
      requiredExperience: number;
    }) => api.post('/offers', payload),
    onSuccess: async () => {
      setToast({ message: 'Offre soumise pour modération', type: 'ok' });
      await queryClient.invalidateQueries({ queryKey: ['hotel-offers'] });
      setShowCreateForm(false);
    },
    onError: () => setToast({ message: 'Échec de la création', type: 'error' }),
  });

  const updateOfferMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      title: string;
      description: string;
      requiredSkills: string[];
      requiredExperience: number;
    }) => api.put(`/offers/${payload.id}`, payload),
    onSuccess: async () => {
      setToast({ message: 'Offre mise à jour', type: 'ok' });
      await queryClient.invalidateQueries({ queryKey: ['hotel-offers'] });
      setEditingOffer(null);
    },
    onError: () => setToast({ message: 'Échec de la mise à jour', type: 'error' }),
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/offers/${id}`),
    onSuccess: async () => {
      setToast({ message: 'Offre supprimée', type: 'ok' });
      await queryClient.invalidateQueries({ queryKey: ['hotel-offers'] });
    },
    onError: () => setToast({ message: 'Impossible de supprimer', type: 'error' }),
  });

  const onCreateOffer = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
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

  const onUpdateOffer = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!editingOffer) return;
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
      render: (o: Offer) => <strong style={{ color: 'var(--color-text)' }}>{o.title}</strong>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (o: Offer) => (
        <span
          className={`status-pill ${o.status === 'ACTIVE' ? 'status-pill--active' : o.status === 'PENDING' ? 'status-pill--pending' : 'status-pill--rejected'}`}
        >
          {o.status === 'ACTIVE' ? 'Actif' : o.status === 'PENDING' ? 'En attente' : 'Fermé'}
        </span>
      ),
    },
    {
      key: 'applications',
      header: 'Candidatures',
      render: (o: Offer) => o._count?.applications ?? 0,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (o: Offer) => (
        <div className="action-btns">
          <button className="action-btn action-btn--edit" onClick={() => setEditingOffer(o)}>
            Modifier
          </button>
          <button
            className="action-btn action-btn--delete"
            onClick={() => deleteOfferMutation.mutate(o.id)}
          >
            Supprimer
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Tableau de Bord Recruteur">
      <div className="stats-row">
        <div className="stats-row__group">
          <StatCard label="Offres Actives" value={activeOffers} variant="dark" />
          <StatCard label="Candidatures Reçues" value={totalApplications} />
        </div>
        <div className="stats-row__actions">
          <button className="btn btn--primary" onClick={() => setShowCreateForm(true)}>
            ✨ Publier une Offre
          </button>
          <Link to="/cv-database" className="btn btn--primary">
            👥 Voir Candidats
          </Link>
        </div>
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">✨ Nouvelle Offre</h2>
              <button className="card__close" onClick={() => setShowCreateForm(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={onCreateOffer}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Titre du poste</label>
                  <input
                    name="title"
                    className="form-input"
                    required
                    minLength={3}
                    placeholder="Ex: Réceptionniste"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expérience requise (années)</label>
                  <input
                    name="requiredExperience"
                    type="number"
                    className="form-input"
                    min={0}
                    max={30}
                    defaultValue={0}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description du poste</label>
                <textarea
                  name="description"
                  className="form-input"
                  required
                  minLength={20}
                  rows={4}
                  placeholder="Décrivez les responsabilités, horaires, avantages..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Compétences requises</label>
                <input
                  name="requiredSkills"
                  className="form-input"
                  placeholder="réception, anglais, service client (séparés par virgule)"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn--primary">
                  🚀 Publier l'offre
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingOffer && (
        <div className="modal-overlay" onClick={() => setEditingOffer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">✏️ Modifier l'Offre</h2>
              <button className="card__close" onClick={() => setEditingOffer(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={onUpdateOffer}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Titre du poste</label>
                  <input
                    name="title"
                    className="form-input"
                    required
                    minLength={3}
                    defaultValue={editingOffer.title}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expérience requise (années)</label>
                  <input
                    name="requiredExperience"
                    type="number"
                    className="form-input"
                    min={0}
                    max={30}
                    defaultValue={editingOffer.requiredExperience}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description du poste</label>
                <textarea
                  name="description"
                  className="form-input"
                  required
                  minLength={20}
                  rows={4}
                  defaultValue={editingOffer.description}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Compétences requises</label>
                <input
                  name="requiredSkills"
                  className="form-input"
                  defaultValue={editingOffer.requiredSkills?.join(', ') ?? ''}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn--primary">
                  💾 Enregistrer
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => setEditingOffer(null)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingApplication && (
        <div className="modal-overlay" onClick={() => setViewingApplication(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">👤 Profil du Candidat</h2>
              <button className="card__close" onClick={() => setViewingApplication(null)}>
                ✕
              </button>
            </div>
            <div className="profile-card">
              <div className="profile-card__avatar">
                {viewingApplication.candidate.fullName?.[0] ??
                  (viewingApplication.candidate.email[0]?.toUpperCase() ?? '?')}
              </div>
              <h3 className="profile-card__name">
                {viewingApplication.candidate.fullName ?? viewingApplication.candidate.email}
              </h3>
              <p className="profile-card__subtitle">
                Candidature pour: {viewingApplication.jobOffer.title}
              </p>
              <p className="profile-card__subtitle" style={{ marginTop: 8 }}>
                Statut:{' '}
                <span
                  className={`status-pill ${viewingApplication.status === 'PENDING' ? 'status-pill--pending' : viewingApplication.status === 'INTERVIEW' ? 'status-pill--active' : 'status-pill--rejected'}`}
                >
                  {viewingApplication.status === 'PENDING'
                    ? 'En attente'
                    : viewingApplication.status === 'INTERVIEW'
                      ? 'Entretien'
                      : 'Refusé'}
                </span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
              <button className="btn btn--primary" onClick={() => setViewingApplication(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">📋 Liste des Offres</h2>
          </div>
          {offersQuery.isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Chargement des offres...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <p className="empty-state__text">Aucune offre publiée</p>
            </div>
          ) : (
            <DataTable columns={tableColumns} data={offers} keyExtractor={(o) => o.id} />
          )}
        </div>

        <div className="card">
          <div className="card__header">
            <h2 className="card__title">🔔 Candidatures Récentes</h2>
          </div>
          {applicationsQuery.isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Chargement des candidatures...</p>
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <p className="empty-state__text">Aucune candidature reçue</p>
            </div>
          ) : (
            <div className="notification-list">
              {recentApplications.map((app) => (
                <div key={app.id} className="notification-item">
                  <div className="notification-item__icon notification-item__icon--info">👤</div>
                  <div className="notification-item__content">
                    <p className="notification-item__text">
                      <strong>{app.candidate.fullName ?? app.candidate.email}</strong> a postulé
                      pour <strong>{app.jobOffer.title}</strong>
                    </p>
                    <span className="notification-item__time">
                      Statut:{' '}
                      {app.status === 'PENDING'
                        ? 'En attente'
                        : app.status === 'INTERVIEW'
                          ? 'Entretien'
                          : 'Refusé'}
                    </span>
                  </div>
                  <button
                    className="action-btn action-btn--view"
                    onClick={() => setViewingApplication(app)}
                  >
                    Voir Profil
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} />
    </DashboardLayout>
  );
};
