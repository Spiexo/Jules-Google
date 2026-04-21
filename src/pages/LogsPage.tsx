import { useAgents } from '../context/AgentsContext';

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

export default function LogsPage() {
  const { sessions } = useAgents();

  const logs = [...sessions]
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    .map(s => ({
      time:    s.createTime,
      level:   s.state === 'FAILED' ? 'ERROR' : 'INFO',
      color:   STATE_COLOR[s.state] ?? 'var(--muted)',
      source:  s.sourceDisplayName,
      message: `[${s.state}] ${s.localDescription}`,
    }));

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Logs</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Historique des événements</p>
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', padding: '0.3rem 0.75rem', border: '1px solid var(--border)', borderRadius: 6 }}>
          {logs.length} entrée{logs.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Terminal header bar */}
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>jules — session log</span>
        </div>

        {/* Log output */}
        <div style={{
          background: '#0a0a0a',
          fontFamily: 'monospace',
          fontSize: 12,
          lineHeight: 1.7,
          maxHeight: 560,
          overflowY: 'auto',
          padding: '1rem',
        }}>
          {logs.length === 0 ? (
            <p style={{ color: '#444', margin: 0 }}>
              ~ aucun log disponible — lancez une session pour commencer
            </p>
          ) : (
            logs.map((log, i) => (
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
                <span style={{ color: log.color, flex: 1 }}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
