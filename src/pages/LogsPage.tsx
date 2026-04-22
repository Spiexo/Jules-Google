import { useState, useEffect, useMemo, useCallback } from 'react';
import { julesService } from '../services/julesService';
import { useAgents } from '../context/AgentsContext';
import type { LogEntry } from '../types/jules';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 25;

const STATE_COLOR: Record<string, string> = {
  QUEUED:                 '#a78bfa',
  PLANNING:               '#60a5fa',
  AWAITING_PLAN_APPROVAL: '#ffa040',
  AWAITING_USER_FEEDBACK: '#ffa040',
  IN_PROGRESS:            'var(--cyan)',
  PAUSED:                 'var(--muted)',
  COMPLETED:              'var(--lime)',
  FAILED:                 'var(--red)',
  STATE_UNSPECIFIED:      '#555',
};

type Level = 'ALL' | 'INFO' | 'ERROR';

export default function LogsPage() {
  const { sessions }                 = useAgents();
  const [diskLogs, setDiskLogs]      = useState<LogEntry[]>([]);
  const [loading, setLoading]        = useState(false);
  const [levelFilter, setLevelFilter]   = useState<Level>('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await julesService.readLogs();
      setDiskLogs([...entries].reverse());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Quand le fichier de log est vide, on dérive depuis les sessions connues
  const logs = useMemo<LogEntry[]>(() => {
    if (diskLogs.length > 0) return diskLogs;
    return [...sessions]
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      .map(s => ({
        time:    s.createTime,
        level:   (s.state === 'FAILED' ? 'ERROR' : 'INFO') as LogEntry['level'],
        source:  s.sourceDisplayName,
        state:   s.state,
        message: `[${s.state}] ${s.localDescription}`,
      }));
  }, [diskLogs, sessions]);

  const sources = useMemo(() =>
    ['ALL', ...Array.from(new Set(logs.map(l => l.source))).sort()],
    [logs]
  );

  const filtered = useMemo(() => logs.filter(l => {
    if (levelFilter !== 'ALL' && l.level !== levelFilter) return false;
    if (sourceFilter !== 'ALL' && l.source !== sourceFilter) return false;
    if (search.trim() && !l.message.toLowerCase().includes(search.toLowerCase()) && !l.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [logs, levelFilter, sourceFilter, search]);

  useEffect(() => { setPage(1); }, [levelFilter, sourceFilter, search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const LEVEL_PILLS: { id: Level; label: string }[] = [
    { id: 'ALL',   label: 'Tout' },
    { id: 'INFO',  label: 'INFO' },
    { id: 'ERROR', label: 'ERROR' },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Logs</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Historique des événements</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', padding: '0.3rem 0.75rem', border: '1px solid var(--border)', borderRadius: 6 }}>
            {filtered.length} / {logs.length} entrée{logs.length !== 1 ? 's' : ''}
          </span>
          <button className="btn-ghost" onClick={loadLogs} disabled={loading} style={{ fontSize: 12, padding: '0.3rem 0.65rem' }}>
            {loading ? '...' : '↻ Actualiser'}
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Level pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {LEVEL_PILLS.map(p => (
            <button
              key={p.id}
              onClick={() => setLevelFilter(p.id)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 500,
                background: levelFilter === p.id ? 'var(--lime)' : 'transparent',
                color:      levelFilter === p.id ? '#000'       : 'var(--muted)',
                border:     levelFilter === p.id ? 'none'       : '1px solid var(--border)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Source dropdown */}
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          style={{ width: 'auto', flex: '0 0 auto' }}
        >
          {sources.map(s => (
            <option key={s} value={s}>{s === 'ALL' ? 'Toutes les sources' : s}</option>
          ))}
        </select>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher dans les logs..."
          style={{ flex: 1, minWidth: 180 }}
        />

        {/* Reset */}
        {(levelFilter !== 'ALL' || sourceFilter !== 'ALL' || search) && (
          <button
            className="btn-ghost"
            style={{ fontSize: 12, padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
            onClick={() => { setLevelFilter('ALL'); setSourceFilter('ALL'); setSearch(''); }}
          >
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* Terminal */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Bar */}
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>jules — session log</span>
        </div>

        {/* Output */}
        <div style={{
          background: '#0a0a0a',
          fontFamily: 'monospace',
          fontSize: 12,
          lineHeight: 1.7,
          minHeight: 120,
          padding: '1rem',
        }}>
          {paginated.length === 0 ? (
            <p style={{ color: '#444', margin: 0 }}>
              {logs.length === 0
                ? '~ aucun log disponible — lancez une session pour commencer'
                : '~ aucun résultat pour ces filtres'}
            </p>
          ) : (
            paginated.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span style={{ color: '#3a3a3a', flexShrink: 0, userSelect: 'none' }}>
                  {log.time ? new Date(log.time).toLocaleTimeString('fr-FR') : '--:--:--'}
                </span>
                <span style={{ color: log.level === 'ERROR' ? 'var(--red)' : '#555', flexShrink: 0, width: 48 }}>
                  [{log.level}]
                </span>
                <span style={{ color: 'var(--muted)', flexShrink: 0, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.source}
                </span>
                <span style={{ color: STATE_COLOR[log.state] ?? 'var(--muted)', flex: 1 }}>{log.message}</span>
              </div>
            ))
          )}
        </div>

        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
      </div>
    </div>
  );
}
