import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage      from './pages/DashboardPage';
import SessionsPage       from './pages/SessionsPage';
import SessionDetailPage  from './pages/SessionDetailPage';
import LogsPage           from './pages/LogsPage';
import SettingsPage       from './pages/SettingsPage';

export type Page = 'dashboard' | 'sessions' | 'logs' | 'settings';

export default function App() {
  const [page, setPage]                       = useState<Page>('dashboard');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const handleNavigate = (p: Page) => {
    setSelectedSession(null);
    setPage(p);
  };

  function renderPage() {
    if (selectedSession) {
      return <SessionDetailPage sessionName={selectedSession} onBack={() => setSelectedSession(null)} />;
    }
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'sessions':  return <SessionsPage onSelectSession={setSelectedSession} />;
      case 'logs':      return <LogsPage />;
      case 'settings':  return <SettingsPage />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar active={page} onNavigate={handleNavigate} />
      <main className="app-content">
        {renderPage()}
      </main>
    </div>
  );
}
