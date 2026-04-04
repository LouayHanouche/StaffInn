import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Toast } from '../components/Toast';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState<'HOTEL' | 'CANDIDATE'>('CANDIDATE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [fullName, setFullName] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setToast(null);
    try {
      await register({
        role,
        email,
        password,
        hotelName: role === 'HOTEL' ? hotelName : undefined,
        fullName: role === 'CANDIDATE' ? fullName : undefined,
      });
      navigate('/');
    } catch (error) {
      if (error instanceof ApiError) {
        setToast(error.message);
        return;
      }
      setToast('Échec de l\'inscription, veuillez réessayer.');
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
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                required
              />
            </div>
          )}
          
          {role === 'HOTEL' && (
            <div className="form-group">
              <label className="form-label">Nom de l'hôtel</label>
              <input
                type="text"
                className="form-input"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="Hôtel Le Magnifique"
                required
              />
            </div>
          )}
          
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
              placeholder="Minimum 10 caractères"
              required
              minLength={10}
            />
          </div>
          
          <button type="submit" className="btn btn--secondary">
            S'inscrire
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
