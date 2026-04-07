import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { DataTable } from '../components/DataTable';
import { Toast } from '../components/Toast';
import { ApiError, api } from '../lib/api';

type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
type TargetType = 'USER' | 'OFFER' | 'APPLICATION';

interface ReportItem {
  id: string;
  targetType: TargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  resolution?: string;
  createdAt: string;
  reporter?: {
    email: string;
  };
}

const statusLabels: Record<ReportStatus, string> = {
  PENDING: 'En attente',
  REVIEWING: 'En cours',
  RESOLVED: 'Résolu',
  DISMISSED: 'Rejeté',
};

const targetTypeLabels: Record<TargetType, string> = {
  USER: 'Utilisateur',
  OFFER: 'Offre',
  APPLICATION: 'Candidature',
};

const statusClasses: Record<ReportStatus, string> = {
  PENDING: 'pending',
  REVIEWING: 'pending',
  RESOLVED: 'active',
  DISMISSED: 'rejected',
};

// === UpdateReportModal Component ===
interface UpdateReportModalProps {
  report: ReportItem;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateReportModal = ({ report, onClose, onSuccess }: UpdateReportModalProps): JSX.Element => {
  const [toast, setToast] = useState<{ message: string | null; type: 'ok' | 'error' }>({
    message: null,
    type: 'ok',
  });
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [resolution, setResolution] = useState(report.resolution ?? '');

  const updateMutation = useMutation({
    mutationFn: (payload: { status: ReportStatus; resolution?: string }) =>
      api.patch(`/admin/reports/${report.id}`, payload),
    onSuccess: () => {
      setToast({ message: 'Signalement mis à jour', type: 'ok' });
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
    updateMutation.mutate({
      status,
      resolution: resolution.trim() || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Traiter le signalement</h2>
          <button className="card__close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="drawer-info">
          <p>
            <strong>Type:</strong> {targetTypeLabels[report.targetType]}
          </p>
          <p>
            <strong>Raison:</strong> {report.reason}
          </p>
          {report.reporter && (
            <p>
              <strong>Signalé par:</strong> {report.reporter.email}
            </p>
          )}
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="report-status">
              Statut
            </label>
            <select
              id="report-status"
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as ReportStatus)}
            >
              <option value="PENDING">En attente</option>
              <option value="REVIEWING">En cours de traitement</option>
              <option value="RESOLVED">Résolu</option>
              <option value="DISMISSED">Rejeté</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="report-resolution">
              Résolution / Notes
            </label>
            <textarea
              id="report-resolution"
              className="form-input"
              rows={4}
              placeholder="Décrivez les actions prises ou la raison du rejet..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
          </div>

          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={onClose} type="button">
              Annuler
            </button>
            <button className="btn btn--primary" type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
        <Toast message={toast.message} type={toast.type} />
      </div>
    </div>
  );
};

// === ViewReportModal Component ===
interface ViewReportModalProps {
  report: ReportItem;
  onClose: () => void;
}

const ViewReportModal = ({ report, onClose }: ViewReportModalProps): JSX.Element => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Détails du signalement</h2>
          <button className="card__close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="report-details">
          <div className="report-details__row">
            <strong>Type:</strong>
            <span>{targetTypeLabels[report.targetType]}</span>
          </div>
          <div className="report-details__row">
            <strong>ID cible:</strong>
            <span className="monospace">{report.targetId}</span>
          </div>
          <div className="report-details__row">
            <strong>Statut:</strong>
            <span className={`status-pill status-pill--${statusClasses[report.status]}`}>
              {statusLabels[report.status]}
            </span>
          </div>
          <div className="report-details__row">
            <strong>Date:</strong>
            <span>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
          {report.reporter && (
            <div className="report-details__row">
              <strong>Signalé par:</strong>
              <span>{report.reporter.email}</span>
            </div>
          )}
          <div className="report-details__section">
            <strong>Raison:</strong>
            <p>{report.reason}</p>
          </div>
          {report.resolution && (
            <div className="report-details__section">
              <strong>Résolution:</strong>
              <p>{report.resolution}</p>
            </div>
          )}
        </div>

        <div className="modal__actions">
          <button className="btn btn--primary" onClick={onClose} type="button">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminReportsPage = (): JSX.Element => {
  const queryClient = useQueryClient();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<TargetType | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal state
  const [viewingReport, setViewingReport] = useState<ReportItem | null>(null);
  const [editingReport, setEditingReport] = useState<ReportItem | null>(null);

  const buildQueryString = (): string => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (statusFilter) {
      params.set('status', statusFilter);
    }
    if (targetTypeFilter) {
      params.set('targetType', targetTypeFilter);
    }
    return params.toString();
  };

  const reportsQuery = useQuery({
    queryKey: ['admin-reports', statusFilter, targetTypeFilter, page],
    queryFn: () =>
      api.get<{
        items: ReportItem[];
        pagination?: { page: number; pageSize: number; total: number };
      }>(`/admin/reports?${buildQueryString()}`),
    refetchInterval: 30_000,
  });

  const reports = reportsQuery.data?.items ?? [];
  const total = reportsQuery.data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
  };

  const columns = [
    {
      key: 'targetType' as const,
      header: 'Type',
      render: (report: ReportItem) => (
        <span className="target-type-badge">{targetTypeLabels[report.targetType]}</span>
      ),
    },
    {
      key: 'reason' as const,
      header: 'Raison',
      render: (report: ReportItem) => (
        <span className="text-truncate" title={report.reason}>
          {report.reason.length > 50 ? `${report.reason.substring(0, 50)}...` : report.reason}
        </span>
      ),
    },
    {
      key: 'status' as const,
      header: 'Statut',
      render: (report: ReportItem) => (
        <span className={`status-pill status-pill--${statusClasses[report.status]}`}>
          {statusLabels[report.status]}
        </span>
      ),
    },
    {
      key: 'createdAt' as const,
      header: 'Date',
      render: (report: ReportItem) => new Date(report.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      key: 'id' as const,
      header: 'Actions',
      render: (report: ReportItem) => (
        <div className="action-btn-group">
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => setViewingReport(report)}
          >
            Voir
          </button>
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={() => setEditingReport(report)}
          >
            Traiter
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Signalements">
      <div className="cv-database-layout">
        <aside className="filter-panel">
          <h3 className="filter-panel__title">Filtres</h3>

          <div className="filter-group">
            <label className="filter-group__label" htmlFor="report-status-filter">
              Statut
            </label>
            <select
              id="report-status-filter"
              className="filter-group__select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ReportStatus | '');
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              <option value="PENDING">En attente</option>
              <option value="REVIEWING">En cours</option>
              <option value="RESOLVED">Résolu</option>
              <option value="DISMISSED">Rejeté</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-group__label" htmlFor="report-target-filter">
              Type de cible
            </label>
            <select
              id="report-target-filter"
              className="filter-group__select"
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value as TargetType | '');
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              <option value="USER">Utilisateur</option>
              <option value="OFFER">Offre</option>
              <option value="APPLICATION">Candidature</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn--outline"
            style={{ width: '100%' }}
            onClick={() => {
              setStatusFilter('');
              setTargetTypeFilter('');
              setPage(1);
            }}
          >
            Réinitialiser
          </button>

          <div className="filter-stats" style={{ marginTop: 16 }}>
            <span className="filter-stats__count">{total}</span>
            <span className="filter-stats__label">signalement{total !== 1 ? 's' : ''}</span>
          </div>
        </aside>

        <div className="cv-database-results">
          {reportsQuery.isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Chargement des signalements...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📋</div>
              <p className="empty-state__text">Aucun signalement trouvé</p>
              <p className="empty-state__subtext">
                {statusFilter || targetTypeFilter
                  ? 'Essayez de modifier vos filtres'
                  : 'Les signalements apparaîtront ici'}
              </p>
            </div>
          ) : (
            <>
              <div className="card">
                <DataTable columns={columns} data={reports} keyExtractor={(report) => report.id} />
              </div>

              <div className="pagination" style={{ marginTop: 18 }}>
                <button
                  className="btn btn--outline btn--sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  Précédent
                </button>
                <div className="pagination__info">
                  Page <strong>{page}</strong> / {totalPages}
                </div>
                <button
                  className="btn btn--outline btn--sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  type="button"
                >
                  Suivant
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {viewingReport && <ViewReportModal report={viewingReport} onClose={() => setViewingReport(null)} />}

      {editingReport && (
        <UpdateReportModal
          report={editingReport}
          onClose={() => setEditingReport(null)}
          onSuccess={handleRefresh}
        />
      )}
    </DashboardLayout>
  );
};
