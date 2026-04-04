import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
}

export const DashboardLayout = ({ title, children }: DashboardLayoutProps) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader title={title} />
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
};
