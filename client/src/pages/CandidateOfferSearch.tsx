import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '../lib/api';
import { DashboardLayout } from '../components/DashboardLayout';
import { Toast } from '../components/Toast';
import {
  mergeSkillSuggestions,
  normalizeSkillsQuery,
  normalizeSkillToken,
  toggleCommaSeparatedSkill,
} from './candidate-offer-search-utils';

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
  hotel: { name: string; address?: string | null };
}

interface OfferFilterMetadata {
  titles: string[];
  skills: string[];
  experienceLevels: number[];
}

interface CandidateProfileData {
  fullName: string;
  position: string;
  experienceYears: number;
  skills: string[];
}

type SortOption = 'createdAt_desc' | 'experience_asc' | 'experience_desc';

function toQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === '') return;
    searchParams.set(k, String(v));
  });
  return searchParams.toString();
}

export const CandidateOfferSearch = (): JSX.Element => {
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<{ message: string | null; type: 'ok' | 'error' }>({
    message: null,
    type: 'ok',
  });

  // Filters
  const [q, setQ] = useState('');
  const [title, setTitle] = useState('');
  const [skills, setSkills] = useState('');
  const [experienceMin, setExperienceMin] = useState<number>(0);
  const [sort, setSort] = useState<SortOption>('createdAt_desc');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filterMetadataQuery = useQuery({
    queryKey: ['candidate-offer-filter-metadata'],
    queryFn: () => api.get<OfferFilterMetadata>('/offers/filters'),
    refetchInterval: 60_000,
  });

  const candidateProfileQuery = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: () => api.get<{ profile: CandidateProfileData }>('/candidates/profile'),
    refetchInterval: 60_000,
  });

  const applicationsQuery = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: () => api.get<{ items: Application[] }>('/candidates/applications'),
    refetchInterval: 15_000,
  });

  const normalizedSkillsQuery = useMemo(() => normalizeSkillsQuery(skills), [skills]);

  const offersQueryString = useMemo(
    () =>
      toQueryString({
        page,
        pageSize,
        q: q.trim() ? q.trim() : undefined,
        title: title.trim() ? title.trim() : undefined,
        skills: normalizedSkillsQuery ? normalizedSkillsQuery : undefined,
        experience_min: experienceMin > 0 ? experienceMin : undefined,
        sort,
      }),
    [experienceMin, normalizedSkillsQuery, page, q, sort, title],
  );

  const offersQuery = useQuery({
    queryKey: ['candidate-offers-search', offersQueryString],
    queryFn: () =>
      api.get<{
        items: JobOffer[];
        pagination?: { page: number; pageSize: number; total: number };
      }>(`/offers?${offersQueryString}`),
    refetchInterval: 15_000,
  });

  const applications = applicationsQuery.data?.items ?? [];
  const appliedIds = new Set(applications.map((item) => item.jobOfferId));
  const offers = offersQuery.data?.items ?? [];
  const total = offersQuery.data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const titleOptions = filterMetadataQuery.data?.titles ?? [];
  const candidateSkills = candidateProfileQuery.data?.profile.skills ?? [];
  const skillOptions = mergeSkillSuggestions(
    candidateSkills,
    filterMetadataQuery.data?.skills ?? [],
  );
  const experienceOptions = filterMetadataQuery.data?.experienceLevels ?? [];
  const selectedSkills = useMemo(
    () => new Set(normalizedSkillsQuery.split(',').filter(Boolean)),
    [normalizedSkillsQuery],
  );

  const [viewingOffer, setViewingOffer] = useState<JobOffer | null>(null);
  const [applyingOffer, setApplyingOffer] = useState<JobOffer | null>(null);
  const [coverLetter, setCoverLetter] = useState('');

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

  const onApplySubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!applyingOffer) return;
    applyMutation.mutate({ offerId: applyingOffer.id, coverLetter });
  };

  return (
    <DashboardLayout title="Recherche d'Offres">
      <div className="cv-database-layout">
        <aside className="filter-panel">
          <h3 className="filter-panel__title">🔎 Recherche</h3>

          <div className="filter-group">
            <label className="filter-group__label" htmlFor="offer-q">
              Mot-clé
            </label>
            <input
              id="offer-q"
              className="filter-group__input"
              placeholder="Ex: réception, spa, night audit..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <label className="filter-group__label" htmlFor="offer-position">
              Poste
            </label>
            <select
              id="offer-position"
              className="filter-group__select"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous les postes</option>
              {titleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-group__label" htmlFor="offer-skills">
              Compétences (virgules)
            </label>
            <input
              id="offer-skills"
              list="offer-skills-suggestions"
              className="filter-group__input"
              placeholder={
                skillOptions.length > 0
                  ? `Ex: ${skillOptions.slice(0, 3).join(', ')}`
                  : 'Ex: anglais, service, PMS'
              }
              value={skills}
              onChange={(e) => {
                setSkills(e.target.value);
                setPage(1);
              }}
            />
            <datalist id="offer-skills-suggestions">
              {skillOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            {candidateSkills.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span className="filter-group__label" style={{ marginBottom: 0 }}>
                    Mes compétences
                  </span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setSkills(candidateSkills.join(', '));
                      setPage(1);
                    }}
                  >
                    Tout utiliser
                  </button>
                </div>
                <div className="skills-list">
                  {candidateSkills.map((skill) => {
                    const isSelected = selectedSkills.has(normalizeSkillToken(skill));

                    return (
                      <button
                        key={skill}
                        type="button"
                        className="skill-tag"
                        style={{
                          cursor: 'pointer',
                          border: isSelected
                            ? '1px solid var(--color-primary)'
                            : '1px solid transparent',
                          background: isSelected ? 'rgba(212, 175, 55, 0.18)' : undefined,
                        }}
                        onClick={() => {
                          setSkills((currentValue) =>
                            toggleCommaSeparatedSkill(currentValue, skill),
                          );
                          setPage(1);
                        }}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="filter-group">
            <label className="filter-group__label" htmlFor="offer-exp">
              Expérience minimum (années)
            </label>
            <select
              id="offer-exp"
              className="filter-group__select"
              value={experienceMin > 0 ? String(experienceMin) : ''}
              onChange={(e) => {
                setExperienceMin(e.target.value ? Number(e.target.value) : 0);
                setPage(1);
              }}
            >
              <option value="">Tous niveaux</option>
              {experienceOptions.map((value) => (
                <option key={value} value={value}>
                  {value}+ ans
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-group__label" htmlFor="offer-sort">
              Tri
            </label>
            <select
              id="offer-sort"
              className="filter-group__select"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption);
                setPage(1);
              }}
            >
              <option value="createdAt_desc">Plus récentes</option>
              <option value="experience_asc">Expérience (croissant)</option>
              <option value="experience_desc">Expérience (décroissant)</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn--outline"
            style={{ width: '100%' }}
            onClick={() => {
              setQ('');
              setTitle('');
              setSkills('');
              setExperienceMin(0);
              setSort('createdAt_desc');
              setPage(1);
            }}
          >
            Réinitialiser
          </button>

          <div className="filter-stats" style={{ marginTop: 16 }}>
            <span className="filter-stats__count">{total}</span>
            <span className="filter-stats__label">offre{total !== 1 ? 's' : ''}</span>
          </div>
        </aside>

        <div className="cv-database-results">
          {offersQuery.isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Chargement des offres...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🔍</div>
              <p className="empty-state__text">Aucune offre trouvée</p>
              <p className="empty-state__subtext">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <>
              <div className="grid-auto">
                {offers.map((offer) => (
                  <div key={offer.id} className="job-card">
                    <div className="job-card__image">🏨</div>
                    <div className="job-card__content">
                      <h3 className="job-card__title">{offer.title}</h3>
                      <p className="job-card__company">{offer.hotel.name}</p>
                      <div className="job-card__meta">
                        <span>📍 {offer.hotel.address ?? '—'}</span>
                        <span>💼 {offer.requiredExperience} ans exp.</span>
                      </div>
                      <div className="job-card__actions">
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setViewingOffer(offer)}
                        >
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
              {viewingOffer.requiredSkills && viewingOffer.requiredSkills.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <strong>Compétences:</strong>
                  <div className="skills-list" style={{ marginTop: 8 }}>
                    {viewingOffer.requiredSkills.slice(0, 10).map((s, idx) => (
                      <span key={idx} className="skill-tag">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {viewingOffer.description && (
                <div className="offer-details__description" style={{ marginTop: 12 }}>
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

      {applyingOffer && (
        <div className="modal-overlay" onClick={() => setApplyingOffer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">📝 Candidature</h2>
              <button className="card__close" onClick={() => setApplyingOffer(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={onApplySubmit}>
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
                <button
                  className="btn btn--ghost"
                  onClick={() => setApplyingOffer(null)}
                  type="button"
                >
                  Annuler
                </button>
                <button
                  className="btn btn--primary"
                  type="submit"
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} />
    </DashboardLayout>
  );
};
