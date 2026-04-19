import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/Toast';
import {
  extractRegisterErrors,
  isApiErrorLike,
  normalizeRegisterPayload,
  validateRegisterPayload,
  type ValidationErrors,
} from './register-utils';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState<'HOTEL' | 'CANDIDATE'>('CANDIDATE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [fullName, setFullName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setToast(null);
    setFieldErrors({});

    const payload = normalizeRegisterPayload({
      role,
      email,
      password,
      hotelName,
      fullName,
    });

    const clientErrors = validateRegisterPayload(payload);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setToast('Veuillez corriger les champs invalides.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(payload);
      navigate('/');
    } catch (error) {
      if (isApiErrorLike(error)) {
        const serverErrors = extractRegisterErrors(error.details);
        if (Object.keys(serverErrors).length > 0) {
          setFieldErrors(serverErrors);
        }
        setToast(error.message);
        return;
      }
      setToast('Impossible de contacter le serveur. Vérifiez la connexion et réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-sidebar">
        <div className="login-logo">
          <img src="/logo.svg" alt="StaffInn" className="login-logo__image" />
        </div>
        <p className="login-tagline">Rejoignez la plateforme</p>
      </aside>

      <div className="login-form-container">
        <div className="login-form-header">
          <img src="/logo.svg" alt="StaffInn" className="login-form-logo" />
          <h1 className="login-form-title">Créer un compte</h1>
          <p className="login-form-subtitle">Commencez votre parcours</p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="role-toggle" style={{ marginTop: 0, marginBottom: 24 }}>
            <button
              type="button"
              className={`role-toggle__btn ${role === 'CANDIDATE' ? 'role-toggle__btn--active' : ''}`}
              onClick={() => setRole('CANDIDATE')}
            >
              Candidat
            </button>
            <button
              type="button"
              className={`role-toggle__btn ${role === 'HOTEL' ? 'role-toggle__btn--active' : ''}`}
              onClick={() => setRole('HOTEL')}
            >
              Recruteur
            </button>
          </div>

          {role === 'CANDIDATE' && (
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setFieldErrors((previous) => ({ ...previous, fullName: undefined }));
                }}
                placeholder="Jean Dupont"
                required
                minLength={2}
                maxLength={150}
              />
              {fieldErrors.fullName ? (
                <small className="form-help form-help--error">{fieldErrors.fullName}</small>
              ) : null}
            </div>
          )}

          {role === 'HOTEL' && (
            <div className="form-group">
              <label className="form-label">Nom de l'hôtel</label>
              <input
                type="text"
                className="form-input"
                value={hotelName}
                onChange={(e) => {
                  setHotelName(e.target.value);
                  setFieldErrors((previous) => ({ ...previous, hotelName: undefined }));
                }}
                placeholder="Hôtel Le Magnifique"
                required
                minLength={2}
                maxLength={150}
              />
              {fieldErrors.hotelName ? (
                <small className="form-help form-help--error">{fieldErrors.hotelName}</small>
              ) : null}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Adresse Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((previous) => ({ ...previous, email: undefined }));
              }}
              placeholder="votre@email.com"
              required
              maxLength={255}
            />
            {fieldErrors.email ? (
              <small className="form-help form-help--error">{fieldErrors.email}</small>
            ) : null}
          </div>

          <div className="form-group">
            <label className="form-label">Mot de Passe</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((previous) => ({ ...previous, password: undefined }));
              }}
              placeholder="10+ caractères, Maj/Min/Chiffre"
              required
              minLength={10}
              maxLength={128}
            />
            {fieldErrors.password ? (
              <small className="form-help form-help--error">{fieldErrors.password}</small>
            ) : null}
          </div>

          <button type="submit" className="btn btn--secondary" disabled={isSubmitting}>
            {isSubmitting ? 'Inscription...' : "S'inscrire"}
          </button>

          <div className="login-links">
            <span className="login-links__text">Déjà inscrit ?</span>
            <Link to="/login" className="login-links__link">
              Se connecter
            </Link>
          </div>
        </form>
      </div>

      <Toast message={toast} type="error" />
    </div>
  );
};
