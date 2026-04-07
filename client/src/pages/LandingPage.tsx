import { Link } from 'react-router-dom';

const roleCards = [
  {
    icon: '🏨',
    title: 'Établissements Hôteliers',
    subtitle: 'Recruteurs',
    bullets: [
      "Publication d'offres d'emploi",
      'Consultation des CV',
      'Recherche de candidats',
      'Gestion des candidatures',
    ],
  },
  {
    icon: '👤',
    title: "Professionnels de l'Hôtellerie",
    subtitle: "Demandeurs d'emploi",
    bullets: ['Création de profil', 'Dépôt de CV', 'Consultation des offres', "Recherche d'opportunités"],
  },
  {
    icon: '🛡️',
    title: 'Administrateurs du Système',
    subtitle: 'Gestion et modération',
    bullets: ['Gestion des comptes', 'Modération des annonces', 'Supervision du système', 'Maintenance technique'],
  },
] as const;

export function LandingPage(): JSX.Element {
  return (
    <div className="landing">
      <header className="landing__header">
        <div className="landing__brand">
          <div className="landing__logo">StaffInn</div>
          <div className="landing__tagline">Plateforme de recrutement pour l’hôtellerie</div>
        </div>
        <div className="landing__actions">
          <Link className="btn btn--outline" to="/login">
            Se connecter
          </Link>
          <Link className="btn btn--primary" to="/register">
            Créer un compte
          </Link>
        </div>
      </header>

      <main className="landing__content">
        <section className="landing__hero">
          <h1 className="landing__title">Trouvez, recrutez, évoluez.</h1>
          <p className="landing__subtitle">
            StaffInn connecte les hôtels et les candidats avec des outils simples, rapides et sécurisés.
          </p>
        </section>

        <section className="landing__roles" aria-label="Rôles et fonctionnalités">
          {roleCards.map((card) => (
            <article key={card.title} className="landing-card">
              <div className="landing-card__icon" aria-hidden="true">
                {card.icon}
              </div>
              <h2 className="landing-card__title">{card.title}</h2>
              <div className="landing-card__divider" />
              <div className="landing-card__subtitle">{card.subtitle}</div>
              <ul className="landing-card__list">
                {card.bullets.map((b) => (
                  <li key={b} className="landing-card__item">
                    <span className="landing-card__dot" aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

