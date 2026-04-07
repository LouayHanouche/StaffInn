import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, apiBaseUrl, uploadCv } from '../lib/api';
import { Toast } from '../components/Toast';
import { DashboardLayout } from '../components/DashboardLayout';

interface CandidateProfileData {
  fullName: string;
  position: string;
  experienceYears: number;
  skills: string[];
  cvPath?: string | null;
}

export const CandidateProfile = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string | null; type: 'ok' | 'error' }>({
    message: null,
    type: 'ok',
  });

  const profileQuery = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: () => api.get<{ profile: CandidateProfileData }>('/candidates/profile'),
    refetchInterval: 15_000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: CandidateProfileData) => api.put('/candidates/profile', payload),
    onSuccess: async () => {
      setToast({ message: 'Profil enregistré', type: 'ok' });
      await queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setToast({ message: error.message, type: 'error' });
        return;
      }
      setToast({ message: 'Erreur lors de la sauvegarde', type: 'error' });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCv(file),
    onSuccess: async () => {
      setToast({ message: 'CV téléchargé', type: 'ok' });
      await queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
    },
    onError: () => setToast({ message: 'Fichier invalide (PDF/DOCX, max 5MB)', type: 'error' }),
  });

  const profile = profileQuery.data?.profile;

  const onSubmitProfile = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await updateProfileMutation.mutateAsync({
      fullName: String(formData.get('fullName') ?? ''),
      position: String(formData.get('position') ?? ''),
      experienceYears: Number(formData.get('experienceYears') ?? 0),
      skills: String(formData.get('skills') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <DashboardLayout title="Mon Profil">
      <div className="grid-2">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">👤 Profil Candidat</h2>
          </div>
          <div className="profile-card">
            <div className="profile-card__avatar">
              {profile?.fullName?.[0]?.toUpperCase() ?? '👤'}
            </div>
            <h3 className="profile-card__name">{profile?.fullName ?? 'Candidat'}</h3>
            <p className="profile-card__subtitle">{profile?.position ?? 'Poste non défini'}</p>
            <p className="profile-card__subtitle" style={{ marginTop: 8 }}>
              📅 {profile?.experienceYears ?? 0} ans d'expérience
            </p>
            {profile?.skills && profile.skills.length > 0 && (
              <div className="skills-list" style={{ marginTop: 16 }}>
                {profile.skills.slice(0, 6).map((skill, idx) => (
                  <span key={idx} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <div className="cv-upload-section">
              <label className="form-label">📄 CV</label>
              {profile?.cvPath ? (
                <div className="cv-status cv-status--uploaded">
                  <span>✅ CV téléchargé</span>
                  <a
                    href={`${apiBaseUrl}/files/cv/${profile.cvPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost btn--sm"
                  >
                    Voir
                  </a>
                </div>
              ) : (
                <p className="text-muted" style={{ marginBottom: 8 }}>
                  Aucun CV téléchargé
                </p>
              )}
              <div className="cv-upload-wrapper">
                <input
                  type="file"
                  id="candidate-cv-upload"
                  accept=".pdf,.doc,.docx"
                  className="cv-upload-input"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadMutation.mutateAsync(file);
                  }}
                />
                <label htmlFor="candidate-cv-upload" className="cv-upload-btn">
                  <span className="cv-upload-btn__icon">📤</span>
                  <span className="cv-upload-btn__text">
                    {profile?.cvPath ? 'Remplacer le CV' : 'Télécharger un CV'}
                  </span>
                  <span className="cv-upload-btn__hint">PDF, DOC, DOCX (max 5MB)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h2 className="card__title">✏️ Mettre à jour</h2>
          </div>
          <form onSubmit={onSubmitProfile}>
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input
                name="fullName"
                className="form-input"
                defaultValue={profile?.fullName ?? ''}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Poste</label>
              <input
                name="position"
                className="form-input"
                defaultValue={profile?.position ?? ''}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Années d'expérience</label>
              <input
                name="experienceYears"
                type="number"
                className="form-input"
                defaultValue={profile?.experienceYears ?? 0}
                min={0}
                max={60}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Compétences (séparées par virgule)</label>
              <input
                name="skills"
                className="form-input"
                defaultValue={profile?.skills?.join(', ') ?? ''}
                required
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} />
    </DashboardLayout>
  );
};
