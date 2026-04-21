import { useAgents } from '../context/AgentsContext';

const ACTIVE_STATES = ['QUEUED', 'PLANNING', 'AWAITING_PLAN_APPROVAL', 'AWAITING_USER_FEEDBACK', 'IN_PROGRESS'];

// Simple SVG line chart — 7 jours de données mock
function LineChart() {
  const data = [2, 5, 3, 8, 6, 11, 7];
  const max  = Math.max(...data);
  const w = 400, h = 100, pad = 10;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((v / max) * (h - pad * 2)),
  }));
  const line    = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const fill    = `${line} L${pts[pts.length-1].x},${h} L${pts[0].x},${h} Z`;
  const days    = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 100, overflow: 'visible' }}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#a3e635" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#a3e635" stopOpacity="0"   />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0,1,2,3].map(i => (
          <line key={i} x1={pad} x2={w-pad} y1={pad + i * ((h-pad*2)/3)} y2={pad + i * ((h-pad*2)/3)}
            stroke="#1f1f1f" strokeWidth="1" />
        ))}
        <path d={fill} fill="url(#lg)" />
        <path d={line} fill="none" stroke="#a3e635" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#a3e635" />)}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {days.map(d => <span key={d} style={{ fontSize: 11, color: 'var(--muted)' }}>{d}</span>)}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, sub }: { label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: accent, letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

const MOCK_PRS = [
  { title: 'feat: add CandlestickChart component',    repo: 'tradingview-clone', agent: 'Jules #1', status: 'Merged', time: '2h ago'  },
  { title: 'fix: authentication token refresh',       repo: 'TEST-Jules',        agent: 'Jules #2', status: 'Open',   time: '45min'  },
  { title: 'refactor: watchlist item component',      repo: 'tradingview-clone', agent: 'Jules #3', status: 'Open',   time: '1h ago'  },
  { title: 'feat: chart toolbar integration',         repo: 'tradingview-clone', agent: 'Jules #1', status: 'Conflict','time': '3h ago'},
];

const PR_BADGE: Record<string, string> = { Merged: 'badge-lime', Open: 'badge-cyan', Conflict: 'badge-red' };

export default function DashboardPage() {
  const { sessions } = useAgents();
  const active    = sessions.filter(s => ACTIVE_STATES.includes(s.state));
  const completed = sessions.filter(s => s.state === 'COMPLETED');
  const limitUsed = sessions.length;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200 }}>

      {/* Page title */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Vue d'ensemble de votre flotte d'agents</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <StatCard label="Sessions actives"      value={active.length}    accent="var(--cyan)" sub={active.length > 0 ? '● En cours' : 'Aucune'} />
        <StatCard label="Terminées aujourd'hui" value={completed.length} accent="var(--lime)" />
        <StatCard label="PRs ouvertes"          value={MOCK_PRS.filter(p => p.status === 'Open').length} accent="var(--cyan)" />
        <div className="card" style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Limite quotidienne</p>
          <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{limitUsed} <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400 }}>/ 15</span></p>
          <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(limitUsed / 15) * 100}%`, background: 'var(--lime)', borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Chart + Active agents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1rem' }}>
        <div className="card">
          <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Activité des sessions — 7 derniers jours</p>
          <LineChart />
        </div>

        <div className="card">
          <p style={{ fontWeight: 600, marginBottom: '1rem' }}>
            Agents actifs
            {active.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--cyan)', background: 'var(--cyan-dim)', padding: '2px 8px', borderRadius: 4 }}>
                {active.length} running
              </span>
            )}
          </p>
          {active.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>Aucun agent en cours</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {active.slice(0, 4).map(s => (
                <div key={s.name} style={{
                  padding: '0.75rem',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  borderLeft: '2px solid var(--cyan)',
                  background: 'var(--s2)',
                  boxShadow: '0 0 8px var(--cyan-dim)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{s.sourceDisplayName}</span>
                    <span className="badge badge-cyan"><span className="pulse">●</span> {s.state}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.localDescription}</p>
                  <div style={{ marginTop: 8, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                    <div className="pulse" style={{ height: '100%', width: '60%', background: 'var(--cyan)', borderRadius: 1 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent PRs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 600 }}>Pull Requests récentes</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Repo</th>
              <th>Agent</th>
              <th>Statut</th>
              <th>Temps</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PRS.map((pr, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text)', fontWeight: 500 }}>{pr.title}</td>
                <td style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: 12 }}>{pr.repo}</td>
                <td style={{ color: 'var(--muted)' }}>{pr.agent}</td>
                <td><span className={`badge ${PR_BADGE[pr.status] ?? 'badge-gray'}`}>{pr.status}</span></td>
                <td style={{ color: 'var(--muted)' }}>{pr.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
