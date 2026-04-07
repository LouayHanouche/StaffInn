import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '../lib/api';
import { Toast } from '../components/Toast';
import { DashboardLayout } from '../components/DashboardLayout';

interface Application {
  id: string;
  status: string;
  jobOfferId: string;
}

interface JobOffer {
  id: string;
  title: string;
  description?: string;
  requiredExperience: number;
  requiredSkills?: string[];
  hotel: { name: string };
}

export const CandidateDashboard = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string | null; type: 'ok' | 'error' }>({
    message: null,
    type: 'ok',
  });
  const [viewingOffer, setViewingOffer] = useState<JobOffer | null>(null);
  const [applyingOffer, setApplyingOffer] = useState<JobOffer | null>(null);
  const [coverLetter, setCoverLetter] = useState('');

  const applicationsQuery = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: () => api.get<{ items: Application[] }>('/candidates/applications'),
    refetchInterval: 15_000,
  });

  const offersQuery = useQuery({
    queryKey: ['candidate-offers'],
    queryFn: () => api.get<{ items: JobOffer[] }>('/offers?page=1&pageSize=6'),
    refetchInterval: 15_000,
  });

  const applyMutation = useMutation({
    mutationFn: (payload: { offerId: string; coverLetter?: string }) =>
      api.post(`/offers/${payload.offerId}/apply`, {
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

  return (
    <DashboardLayout title="Tableau de Bord Candidat">
      {applicationsQuery.isLoading || offersQuery.isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Chargement du tableau de bord...</p>
        </div>
      ) : (
        <>
      {/* Vue d'ensemble */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Vue d'ensemble</h2>
        </div>
        <div className="stats-row">
          <div className="stat-card stat-card--gradient">
            <div className="stat-card__icon">📋</div>
            <div className="stat-card__content">
              <span className="stat-card__value">{applications.length}</span>
              <span className="stat-card__label">Candidatures</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">⏳</div>
            <div className="stat-card__content">
              <span className="stat-card__value">{pendingCount}</span>
              <span className="stat-card__label">En Attente</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">🎯</div>
            <div className="stat-card__content">
              <span className="stat-card__value">{interviewCount}</span>
              <span className="stat-card__label">Entretiens</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">✅</div>
            <div className="stat-card__content">
              <span className="stat-card__value">{acceptedCount}</span>
              <span className="stat-card__label">Acceptées</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">❌</div>
            <div className="stat-card__content">
              <span className="stat-card__value">{rejectedCount}</span>
              <span className="stat-card__label">Refusées</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px' }} />

      {/* Offres Recommandées */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">🏨 Offres Recommandées</h2>
        </div>
        {offers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📭</div>
            <p className="empty-state__text">Aucune offre disponible</p>
          </div>
        ) : (
          <div className="grid-auto">
            {offers.map((offer) => (
              <div key={offer.id} className="job-card">
                <div className="job-card__image">🏨</div>
                <div className="job-card__content">
                  <h3 className="job-card__title">{offer.title}</h3>
                  <p className="job-card__company">{offer.hotel.name}</p>
                  <div className="job-card__meta">
                    <span>📍 Paris</span>
                    <span>💼 {offer.requiredExperience} ans exp.</span>
                  </div>
                  <div className="job-card__actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => setViewingOffer(offer)}>
                      Détails
                    </button>
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={() => setApplyingOffer(offer)}
                      disabled={appliedIds.has(offer.id)}
                    >
                      {appliedIds.has(offer.id) ? 'Déjà postulé' : 'Postuler'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offer Details Modal */}
      {viewingOffer && (
        <div className="modal-overlay" onClick={() => setViewingOffer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">🏨 {viewingOffer.title}</h2>
              <button className="card__close" onClick={() => setViewingOffer(null)}>
                ✕
              </button>
            </div>
            <div className="offer-details">
              <p className="offer-details__company">
                <strong>Hôtel:</strong> {viewingOffer.hotel.name}
              </p>
              <p className="offer-details__experience">
                <strong>Expérience:</strong> {viewingOffer.requiredExperience} ans
              </p>
              {viewingOffer.description && (
                <div className="offer-details__description">
                  <strong>Description:</strong>
                  <p>{viewingOffer.description}</p>
                </div>
              )}
            </div>
            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={() => setViewingOffer(null)}>
                Fermer
              </button>
              <button
                className="btn btn--primary"
                onClick={() => setApplyingOffer(viewingOffer)}
                disabled={appliedIds.has(viewingOffer.id)}
              >
                {appliedIds.has(viewingOffer.id) ? 'Déjà postulé' : 'Postuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyingOffer && (
        <div className="modal-overlay" onClick={() => setApplyingOffer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">📝 Candidature</h2>
              <button className="card__close" onClick={() => setApplyingOffer(null)}>
                ✕
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Poste ciblé</label>
              <div className="form-input form-input--readonly">
                {applyingOffer.title} · {applyingOffer.hotel.name}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Lettre de motivation (optionnelle)</label>
              <textarea
                className="form-input"
                rows={5}
                placeholder="Décrivez brièvement votre motivation..."
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
              />
            </div>
            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={() => setApplyingOffer(null)}>
                Annuler
              </button>
              <button
                className="btn btn--primary"
                onClick={() =>
                  applyMutation.mutate({
                    offerId: applyingOffer.id,
                    coverLetter,
                  })
                }
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

        </>
      )}
      <Toast message={toast.message} type={toast.type} />
    </DashboardLayout>
  );
};
