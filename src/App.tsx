import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import SessionsPage  from './pages/SessionsPage';
import AgentsPage    from './pages/AgentsPage';
import LogsPage      from './pages/LogsPage';
import SettingsPage  from './pages/SettingsPage';

export type Page = 'dashboard' | 'sessions' | 'agents' | 'logs' | 'settings';

const PAGES: Record<Page, JSX.Element> = {
  dashboard: <DashboardPage />,
  sessions:  <SessionsPage />,
  agents:    <AgentsPage />,
  logs:      <LogsPage />,
  settings:  <SettingsPage />,
};

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="app-layout">
      <Sidebar active={page} onNavigate={setPage} />
      <main className="app-content">
        {PAGES[page]}
      </main>
    </div>
  );
}
