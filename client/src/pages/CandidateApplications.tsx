import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { DashboardLayout } from '../components/DashboardLayout';

interface Application {
  id: string;
  status: string;
  jobOffer: { title: string; hotel: { name: string } };
}

export const CandidateApplications = (): JSX.Element => {
  const applicationsQuery = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: () => api.get<{ items: Application[] }>('/candidates/applications'),
    refetchInterval: 15_000,
  });

  const applications = applicationsQuery.data?.items ?? [];

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'INTERVIEW':
        return 'Entretien';
      case 'ACCEPTED':
        return 'Recruté';
      case 'REJECTED':
        return 'Refusée';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'status-pill--pending';
      case 'INTERVIEW':
        return 'status-pill--active';
      case 'ACCEPTED':
        return 'status-pill--active';
      case 'REJECTED':
        return 'status-pill--rejected';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout title="Candidatures">
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">📋 Mes candidatures</h2>
        </div>
        {applicationsQuery.isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Chargement des candidatures...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📭</div>
            <p className="empty-state__text">Aucune candidature</p>
          </div>
        ) : (
          <div className="applications-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Poste</th>
                  <th>Hôtel</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.jobOffer.title}</td>
                    <td>{app.jobOffer.hotel.name}</td>
                    <td>
                      <span className={`status-pill ${getStatusClass(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
