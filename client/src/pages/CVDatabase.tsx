import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { ApiError, api } from '../lib/api';
import { Toast } from '../components/Toast';

interface Candidate {
  id: string;
  email: string;
  fullName?: string;
  position?: string;
  experienceYears?: number;
  skills?: string[];
  cvPath?: string;
  isActive: boolean;
}

interface OfferOption {
  id: string;
  title: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED';
}

type ExperienceFilter = 'all' | '0-2' | '3-5' | '5+';

const experienceOptions: { value: ExperienceFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: '0-2', label: '0-2 ans' },
  { value: '3-5', label: '3-5 ans' },
  { value: '5+', label: '5+ ans' },
];

const positionOptions = [
  { value: '', label: 'Tous les postes' },
  { value: 'receptionniste', label: 'Réceptionniste' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'serveur', label: 'Serveur/Serveuse' },
  { value: 'cuisinier', label: 'Cuisinier' },
  { value: 'femme_chambre', label: 'Femme de chambre' },
  { value: 'manager', label: 'Manager' },
];

function getInitials(fullName?: string, email?: string): string {
  if (fullName) {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() ?? '??';
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

function matchesExperienceFilter(years: number | undefined, filter: ExperienceFilter): boolean {
  if (filter === 'all') return true;
  if (years === undefined) return filter === '0-2';
  if (filter === '0-2') return years <= 2;
  if (filter === '3-5') return years >= 3 && years <= 5;
  return years > 5;
}

export const CVDatabase = (): JSX.Element => {
  const [experienceFilter, setExperienceFilter] = useState<ExperienceFilter>('all');
  const [positionFilter, setPositionFilter] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('');
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [recruitingCandidate, setRecruitingCandidate] = useState<Candidate | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [recruitStatus, setRecruitStatus] = useState('INTERVIEW');
  const [recruitToast, setRecruitToast] = useState<{ message: string | null; type: 'ok' | 'error' }>(
    {
      message: null,
      type: 'ok',
    },
  );

  const candidatesQuery = useQuery({
    queryKey: ['cv-database'],
    queryFn: () => api.get<{ items: Candidate[] }>('/candidates?page=1&pageSize=100'),
    refetchInterval: 30_000,
  });

  const offersQuery = useQuery({
    queryKey: ['hotel-offers'],
    queryFn: () => api.get<{ items: OfferOption[] }>('/offers'),
    refetchInterval: 30_000,
  });

  const candidates = candidatesQuery.data?.items ?? [];
  const offers = (offersQuery.data?.items ?? []).filter((offer) => offer.title);
  const activeOffers = offers.filter((offer) => offer.status === 'ACTIVE');

  const filteredCandidates = candidates.filter((candidate) => {
    if (!matchesExperienceFilter(candidate.experienceYears, experienceFilter)) {
      return false;
    }

    if (positionFilter && candidate.position?.toLowerCase() !== positionFilter) {
      return false;
    }

    if (skillsFilter) {
      const searchTerms = skillsFilter
        .toLowerCase()
        .split(',')
        .map((s) => s.trim());
      const candidateSkills = (candidate.skills ?? []).map((s) => s.toLowerCase());
      const hasMatchingSkill = searchTerms.some((term) =>
        candidateSkills.some((skill) => skill.includes(term))
      );
      if (!hasMatchingSkill) return false;
    }

    return true;
  });

  return (
    <DashboardLayout title="Base de Candidats">
      <div className="cv-database-layout">
        <aside className="filter-panel">
          <h3 className="filter-panel__title">🔍 Filtres</h3>

          <div className="filter-group">
            <label className="filter-group__label" htmlFor="experience-filter">
              Expérience
            </label>
            <select
              id="experience-filter"
              className="filter-group__select"
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value as ExperienceFilter)}
            >
              {experienceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-group__label" htmlFor="position-filter">
              Poste recherché
            </label>
            <select
              id="position-filter"
              className="filter-group__select"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              {positionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-group__label" htmlFor="skills-filter">
              Compétences
            </label>
            <input
              id="skills-filter"
              type="text"
              className="filter-group__input"
              placeholder="Ex: anglais, service..."
              value={skillsFilter}
              onChange={(e) => setSkillsFilter(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn--outline"
            style={{ width: '100%' }}
            onClick={() => {
              setExperienceFilter('all');
              setPositionFilter('');
              setSkillsFilter('');
            }}
          >
            Réinitialiser
          </button>

          <div className="filter-stats">
            <span className="filter-stats__count">{filteredCandidates.length}</span>
            <span className="filter-stats__label">candidat{filteredCandidates.length !== 1 ? 's' : ''} trouvé{filteredCandidates.length !== 1 ? 's' : ''}</span>
          </div>
        </aside>

        <div className="cv-database-results">
          {candidatesQuery.isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Chargement des candidats...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🔍</div>
              <p className="empty-state__text">Aucun candidat trouvé</p>
              <p className="empty-state__subtext">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="candidate-card">
                <div className="candidate-card__header">
                  <div className="candidate-card__avatar">
                    {getInitials(candidate.fullName, candidate.email)}
                  </div>
                  <div className="candidate-card__info">
                    <div className="candidate-card__name">
                      {candidate.fullName ?? candidate.email}
                    </div>
                    <div className="candidate-card__position">
                      {candidate.position ?? 'Poste non spécifié'}
                    </div>
                  </div>
                  <div className="candidate-card__status">
                    <span
                      className={`status-pill status-pill--${candidate.isActive ? 'active' : 'rejected'}`}
                    >
                      {candidate.isActive ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                </div>

                <div className="candidate-card__details">
                  <div className="candidate-card__detail">
                    <span className="candidate-card__detail-icon">📧</span>
                    {candidate.email}
                  </div>
                  {candidate.experienceYears !== undefined && (
                    <div className="candidate-card__detail">
                      <span className="candidate-card__detail-icon">💼</span>
                      {candidate.experienceYears} ans d'expérience
                    </div>
                  )}
                </div>

                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="candidate-card__skills">
                    {candidate.skills.slice(0, 5).map((skill, idx) => (
                      <span key={idx} className="candidate-card__skill">
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 5 && (
                      <span className="candidate-card__skill candidate-card__skill--more">
                        +{candidate.skills.length - 5}
                      </span>
                    )}
                  </div>
                )}

                <div className="candidate-card__actions">
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => setViewingCandidate(candidate)}
                  >
                    Voir Profil
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => {
                      setRecruitingCandidate(candidate);
                      setSelectedOfferId('');
                      setRecruitStatus('INTERVIEW');
                    }}
                  >
                    Recruter
                  </button>
                  {candidate.cvPath && (
                    <a
                      href={`/api${candidate.cvPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--outline btn--sm"
                    >
                      📄 Télécharger CV
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {viewingCandidate && (
        <div className="modal-overlay" onClick={() => setViewingCandidate(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">👤 Profil du Candidat</h2>
              <button className="card__close" onClick={() => setViewingCandidate(null)}>
                ✕
              </button>
            </div>
            <div className="profile-card profile-card--modal">
              <div className="profile-card__avatar profile-card__avatar--large">
                {getInitials(viewingCandidate.fullName, viewingCandidate.email)}
              </div>
              <h3 className="profile-card__name">
                {viewingCandidate.fullName ?? viewingCandidate.email}
              </h3>
              <p className="profile-card__subtitle">
                {viewingCandidate.position ?? 'Poste non spécifié'}
              </p>

              <div className="profile-details">
                <div className="profile-detail">
                  <span className="profile-detail__label">📧 Email</span>
                  <span className="profile-detail__value">{viewingCandidate.email}</span>
                </div>
                <div className="profile-detail">
                  <span className="profile-detail__label">💼 Expérience</span>
                  <span className="profile-detail__value">
                    {viewingCandidate.experienceYears ?? 0} ans
                  </span>
                </div>
                <div className="profile-detail">
                  <span className="profile-detail__label">🔔 Disponibilité</span>
                  <span className="profile-detail__value">
                    <span
                      className={`status-pill status-pill--${viewingCandidate.isActive ? 'active' : 'rejected'}`}
                    >
                      {viewingCandidate.isActive ? 'Disponible' : 'Indisponible'}
                    </span>
                  </span>
                </div>
              </div>

              {viewingCandidate.skills && viewingCandidate.skills.length > 0 && (
                <div className="profile-skills">
                  <span className="profile-skills__label">🎯 Compétences</span>
                  <div className="skills-list">
                    {viewingCandidate.skills.map((skill, idx) => (
                      <span key={idx} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={() => setViewingCandidate(null)}>
                Fermer
              </button>
              {viewingCandidate.cvPath && (
                <a
                  href={`/api${viewingCandidate.cvPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                >
                  📄 Télécharger CV
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {recruitingCandidate && (
        <div className="modal-overlay" onClick={() => setRecruitingCandidate(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">✅ Recruter un candidat</h2>
              <button className="card__close" onClick={() => setRecruitingCandidate(null)}>
                ✕
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Candidat</label>
              <div className="form-input form-input--readonly">
                {recruitingCandidate.fullName ?? recruitingCandidate.email}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Offre</label>
              <select
                className="form-input"
                value={selectedOfferId}
                onChange={(event) => setSelectedOfferId(event.target.value)}
              >
                <option value="">Sélectionner une offre</option>
                {activeOffers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select
                className="form-input"
                value={recruitStatus}
                onChange={(event) => setRecruitStatus(event.target.value)}
              >
                <option value="INTERVIEW">Entretien</option>
                <option value="ACCEPTED">Accepté</option>
              </select>
            </div>
            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={() => setRecruitingCandidate(null)}>
                Annuler
              </button>
              <button
                className="btn btn--primary"
                disabled={!selectedOfferId}
                onClick={async () => {
                  if (!selectedOfferId) return;
                  try {
                    await api.post('/hotel/applications', {
                      candidateId: recruitingCandidate.id,
                      offerId: selectedOfferId,
                      status: recruitStatus,
                    });
                    setRecruitToast({ message: 'Candidature créée', type: 'ok' });
                    setRecruitingCandidate(null);
                  } catch (error) {
                    if (error instanceof ApiError) {
                      setRecruitToast({ message: error.message, type: 'error' });
                      return;
                    }
                    setRecruitToast({ message: 'Impossible de recruter ce candidat', type: 'error' });
                  }
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={recruitToast.message} type={recruitToast.type} />
    </DashboardLayout>
  );
};
