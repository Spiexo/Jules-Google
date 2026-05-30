import { useState, useEffect, type FormEvent } from 'react';
import { RefreshCw, Play, AlertCircle } from 'lucide-react';
import { useAgents } from '../context/AgentsContext';

export default function LaunchForm() {
  const { sources, loadingSources, creatingSession, error, fetchSources, createSession } = useAgents();
  const [selectedSource, setSelectedSource] = useState('');
  const [description, setDescription]       = useState('');

  useEffect(() => {
    if (sources.length === 0) fetchSources();
  }, [fetchSources]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSource || !description.trim()) return;
    await createSession({ sourceName: selectedSource, description: description.trim() });
    setDescription('');
  };

  const canSubmit = selectedSource && description.trim() && !creatingSession;

  return (
    <div className="card">
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Lancer un agent</p>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '1.25rem' }}>
        Jules analysera le dépôt et ouvrira une Pull Request automatiquement.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Dépôt GitHub</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} disabled={loadingSources} style={{ flex: 1 }}>
              <option value="" disabled>
                {loadingSources ? 'Chargement...' : sources.length === 0 ? 'Aucune source — cliquez Actualiser' : 'Sélectionner un dépôt'}
              </option>
              {sources.map(s => (
                <option key={s.name} value={s.name}>
                  {s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : s.id || s.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn-ghost" onClick={fetchSources} disabled={loadingSources} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} strokeWidth={2} style={{ animation: loadingSources ? 'spin 1s linear infinite' : 'none' }} />
              {loadingSources ? '...' : 'Actualiser'}
            </button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Tâche à effectuer</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ex : Ajoute des tests unitaires pour le module d'authentification"
            rows={3}
          />
        </div>

        {error && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} strokeWidth={2} />
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={!canSubmit} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Play size={14} strokeWidth={2.2} fill="currentColor" />
          {creatingSession ? 'Lancement...' : 'Lancer l\'agent'}
        </button>
      </form>
    </div>
  );
}
