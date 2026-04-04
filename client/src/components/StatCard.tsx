interface StatCardProps {
  label: string;
  value: number | string;
  variant?: 'dark' | 'light';
}

export const StatCard = ({ label, value, variant = 'dark' }: StatCardProps) => {
  return (
    <div className={`stat-card ${variant === 'light' ? 'stat-card--light' : ''}`}>
      <div>
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
      </div>
    </div>
  );
};
