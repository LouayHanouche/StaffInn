import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { DashboardLayout } from '../components/DashboardLayout';

interface Application {
  id: string;
  status: string;
  createdAt: string;
  jobOffer: {
    title: string;
    description?: string;
    hotel: { name: string };
  };
}

export const CandidateRecruitments = (): JSX.Element => {
  const applicationsQuery = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: () => api.get<{ items: Application[] }>('/candidates/applications'),
    refetchInterval: 15_000,
  });

  const recruitments = (applicationsQuery.data?.items ?? []).filter(
    (app) => app.status === 'ACCEPTED'
  );

  return (
    <DashboardLayout title="Recrutements">
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">✅ Offres où vous êtes recruté</h2>
        </div>
        {applicationsQuery.isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Chargement des recrutements...</p>
          </div>
        ) : recruitments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🎯</div>
            <p className="empty-state__text">Aucun recrutement pour le moment</p>
            <p className="empty-state__subtext">
              Vos offres acceptées apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="grid-auto">
            {recruitments.map((recruitment) => (
              <div key={recruitment.id} className="job-card job-card--recruited">
                <div className="job-card__badge">✅ Recruté</div>
                <div className="job-card__image">🏨</div>
                <div className="job-card__content">
                  <h3 className="job-card__title">{recruitment.jobOffer.title}</h3>
                  <p className="job-card__company">{recruitment.jobOffer.hotel.name}</p>
                  {recruitment.jobOffer.description && (
                    <p className="job-card__description">
                      {recruitment.jobOffer.description.slice(0, 100)}
                      {recruitment.jobOffer.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  <div className="job-card__meta">
                    <span className="status-pill status-pill--active">Accepté</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
