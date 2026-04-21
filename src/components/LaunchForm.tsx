import { useState, useEffect } from 'react';
import { useAgents } from '../context/AgentsContext';

export default function LaunchForm() {
  const { sources, loadingSources, creatingSession, error, fetchSources, createSession } = useAgents();
  const [selectedSource, setSelectedSource] = useState('');
  const [description, setDescription]       = useState('');

  // Charge les sources automatiquement à l'affichage
  useEffect(() => {
    if (sources.length === 0) fetchSources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
                {loadingSources ? 'Chargement...' : sources.length === 0 ? 'Aucune source — cliquez ↻' : 'Sélectionner un dépôt'}
              </option>
              {sources.map(s => (
                <option key={s.name} value={s.name}>
                  {s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : s.id || s.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn-ghost" onClick={fetchSources} disabled={loadingSources}>
              {loadingSources ? '...' : '↻'}
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

        {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>✗ {error}</p>}

        <button type="submit" className="btn-primary" disabled={!canSubmit} style={{ alignSelf: 'flex-start' }}>
          {creatingSession ? '⟳ Lancement...' : '⚡ Lancer l\'agent'}
        </button>
      </form>
    </div>
  );
}
