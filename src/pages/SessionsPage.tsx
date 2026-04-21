import { useState } from 'react';
import { useAgents } from '../context/AgentsContext';
import { julesService } from '../services/julesService';

const ACTIVE_STATES = ['QUEUED', 'PLANNING', 'AWAITING_PLAN_APPROVAL', 'AWAITING_USER_FEEDBACK', 'IN_PROGRESS'];

const STATE_BADGE: Record<string, string> = {
  QUEUED:                 'badge-purple',
  PLANNING:               'badge-cyan',
  AWAITING_PLAN_APPROVAL: 'badge-orange',
  AWAITING_USER_FEEDBACK: 'badge-orange',
  IN_PROGRESS:            'badge-cyan',
  PAUSED:                 'badge-gray',
  COMPLETED:              'badge-lime',
  FAILED:                 'badge-red',
  STATE_UNSPECIFIED:      'badge-gray',
};

const STATE_LABEL: Record<string, string> = {
  QUEUED:                 'En file',
  PLANNING:               'Planification',
  AWAITING_PLAN_APPROVAL: 'Plan à approuver',
  AWAITING_USER_FEEDBACK: 'Retour requis',
  IN_PROGRESS:            'En cours',
  PAUSED:                 'En pause',
  COMPLETED:              'Terminé',
  FAILED:                 'Échec',
  STATE_UNSPECIFIED:      'Inconnu',
};

function timeAgo(isoDate?: string): string {
  if (!isoDate) return 'à l\'instant';
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (isNaN(diff) || diff < 0) return 'à l\'instant';
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}

type Filter = 'all' | 'active' | 'completed' | 'failed';

export default function SessionsPage() {
  const { sessions, sources, loadingSources, creatingSession, error, fetchSources, createSession } = useAgents();
  const [filter, setFilter]                 = useState<Filter>('all');
  const [showNew, setShowNew]               = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  const [description, setDescription]       = useState('');
  const [expandedName, setExpandedName]     = useState<string | null>(null);

  const filtered = sessions.filter(s => {
    if (filter === 'active')    return ACTIVE_STATES.includes(s.state);
    if (filter === 'completed') return s.state === 'COMPLETED';
    if (filter === 'failed')    return s.state === 'FAILED';
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource || !description.trim()) return;
    await createSession({ sourceName: selectedSource, description: description.trim() });
    setDescription('');
    setShowNew(false);
  };

  const FILTERS: { id: Filter; label: string; count: number }[] = [
    { id: 'all',       label: 'Tout',      count: sessions.length },
    { id: 'active',    label: 'Actives',   count: sessions.filter(s => ACTIVE_STATES.includes(s.state)).length },
    { id: 'completed', label: 'Terminées', count: sessions.filter(s => s.state === 'COMPLETED').length },
    { id: 'failed',    label: 'Échecs',    count: sessions.filter(s => s.state === 'FAILED').length },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Sessions</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Gérez vos sessions d'agents Jules</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(v => !v)}>
          {showNew ? '✕ Annuler' : '+ Nouvelle session'}
        </button>
      </div>

      {/* New session panel */}
      {showNew && (
        <div className="card">
          <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Lancer un nouvel agent</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select
                value={selectedSource}
                onChange={e => setSelectedSource(e.target.value)}
                disabled={loadingSources}
                style={{ flex: 1 }}
              >
                <option value="" disabled>
                  {loadingSources ? 'Chargement...' : sources.length === 0 ? 'Aucune source' : 'Sélectionner un dépôt'}
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
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décris la tâche à effectuer..."
              rows={3}
            />
            {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>✗ {error}</p>}
            <button
              type="submit"
              className="btn-primary"
              disabled={!selectedSource || !description.trim() || creatingSession}
              style={{ alignSelf: 'flex-start' }}
            >
              {creatingSession ? '⟳ Lancement...' : '⚡ Lancer'}
            </button>
          </form>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8 }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '0.3rem 0.85rem',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 500,
              background: filter === f.id ? 'var(--lime)' : 'transparent',
              color:      filter === f.id ? '#000'       : 'var(--muted)',
              border:     filter === f.id ? 'none'       : '1px solid var(--border)',
            }}
          >
            {f.label}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Sessions table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '3rem', fontSize: 13 }}>
            Aucune session
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Dépôt</th>
                <th>Tâche</th>
                <th>Statut</th>
                <th>Lancée</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <>
                  <tr
                    key={s.name}
                    onClick={() => setExpandedName(expandedName === s.name ? null : s.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>{s.sourceDisplayName}</td>
                    <td style={{ maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                      {s.localDescription}
                    </td>
                    <td>
                      <span className={`badge ${STATE_BADGE[s.state] ?? 'badge-gray'}`}>
                        {ACTIVE_STATES.includes(s.state) && <span className="pulse">●</span>}
                        {STATE_LABEL[s.state] ?? s.state}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>il y a {timeAgo(s.createTime)}</td>
                  </tr>

                  {/* Detail panel */}
                  {expandedName === s.name && (
                    <tr key={`${s.name}-detail`}>
                      <td colSpan={4} style={{ background: 'var(--s2)', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                          {/* Full description */}
                          <p style={{ fontSize: 13, color: 'var(--text)' }}>{s.localDescription}</p>

                          {/* Metadata */}
                          <div style={{ display: 'flex', gap: '1.5rem', fontSize: 11, color: 'var(--muted)' }}>
                            {s.id && <span>ID: <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{s.id}</span></span>}
                            {s.updateTime && <span>Mis à jour: {new Date(s.updateTime).toLocaleString('fr-FR')}</span>}
                          </div>

                          {/* Actions */}
                          {s.url && (
                            <div style={{ marginTop: 4 }}>
                              <button
                                className="btn-ghost"
                                onClick={() => julesService.openExternal(s.url!)}
                                style={{ fontSize: 12, padding: '0.35rem 0.8rem' }}
                              >
                                ↗ Ouvrir dans Jules
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
