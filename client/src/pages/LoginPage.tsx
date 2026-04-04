import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Toast } from '../components/Toast';

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Échec de la connexion, veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-sidebar">
        <div className="login-logo">
          <img src="/logo.svg" alt="StaffInn" className="login-logo__image" />
        </div>
        <p className="login-tagline">
          Plateforme de recrutement pour l'hôtellerie et le tourisme
        </p>
        <div className="login-features">
          <div className="login-feature">
            <span className="login-feature__icon">🏨</span>
            <span>Trouvez les meilleurs talents</span>
          </div>
          <div className="login-feature">
            <span className="login-feature__icon">👥</span>
            <span>Gérez vos candidatures</span>
          </div>
          <div className="login-feature">
            <span className="login-feature__icon">📋</span>
            <span>Publiez vos offres</span>
          </div>
        </div>
      </aside>

      <div className="login-form-container">
        <div className="login-form-header">
          <img src="/logo.svg" alt="StaffInn" className="login-form-logo" />
          <h1 className="login-form-title">Connexion</h1>
          <p className="login-form-subtitle">
            Connectez-vous à votre espace personnel
          </p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Adresse Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mot de Passe</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
              minLength={10}
            />
          </div>

          <button type="submit" className="btn btn--primary btn--lg" disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Se Connecter'}
          </button>

          <div className="login-links">
            <span className="login-links__text">Pas encore de compte ?</span>
            <Link to="/register" className="login-links__link">
              Créer un compte
            </Link>
          </div>
        </form>
      </div>

      <Toast message={errorMessage} type="error" />
    </div>
  );
};
