import { useState } from 'react';
import { useAgents } from '../context/AgentsContext';
import { julesService } from '../services/julesService';
import type { LocalSession } from '../types/jules';
import Pagination from '../components/Pagination';

const PR_PAGE_SIZE = 5;

const ACTIVE_STATES = ['QUEUED', 'PLANNING', 'AWAITING_PLAN_APPROVAL', 'AWAITING_USER_FEEDBACK', 'IN_PROGRESS'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildChartData(sessions: LocalSession[]): number[] {
  const counts = Array(7).fill(0);
  const now = Date.now();
  sessions.forEach(s => {
    const diffDays = Math.floor((now - new Date(s.createTime).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) counts[6 - diffDays]++;
  });
  return counts;
}

function getLast7DayLabels(): string[] {
  const NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return NAMES[d.getDay()];
  });
}

function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (isNaN(diff) || diff < 0) return 'à l\'instant';
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}

function buildPRList(sessions: LocalSession[]) {
  return sessions
    .filter(s => s.outputs?.some(o => o.pullRequest))
    .map(s => {
      const pr = s.outputs!.find(o => o.pullRequest)!.pullRequest!;
      return {
        title:  pr.title || s.title || s.localDescription,
        repo:   s.sourceDisplayName,
        url:    pr.url,
        time:   s.updateTime || s.createTime,
        state:  s.state,
      };
    });
}

const PR_BADGE: Record<string, string> = {
  COMPLETED: 'badge-lime',
  FAILED:    'badge-red',
};

const PR_LABEL: Record<string, string> = {
  COMPLETED: 'Merged',
  FAILED:    'Fermée',
};

// ── Composants ─────────────────────────────────────────────────────────────────

function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  const w = 400, h = 100, pad = 10;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((v / max) * (h - pad * 2)),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const fill = `${line} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 100, overflow: 'visible' }}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#a3e635" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#a3e635" stopOpacity="0"   />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1={pad} x2={w - pad}
            y1={pad + i * ((h - pad * 2) / 3)}
            y2={pad + i * ((h - pad * 2) / 3)}
            stroke="#1f1f1f" strokeWidth="1" />
        ))}
        <path d={fill} fill="url(#lg)" />
        <path d={line} fill="none" stroke="#a3e635" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#a3e635" />)}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {labels.map(d => <span key={d} style={{ fontSize: 11, color: 'var(--muted)' }}>{d}</span>)}
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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { sessions } = useAgents();

  const active    = sessions.filter(s => ACTIVE_STATES.includes(s.state));
  const completedToday = sessions.filter(s => {
    if (s.state !== 'COMPLETED') return false;
    const ref = s.updateTime ?? s.createTime;
    return Date.now() - new Date(ref).getTime() < 86_400_000;
  });

  const chartData   = buildChartData(sessions);
  const chartLabels = getLast7DayLabels();
  const prs         = buildPRList(sessions);
  const openPRs     = prs.filter(p => !['COMPLETED', 'FAILED'].includes(p.state ?? ''));

  const [prPage, setPrPage] = useState(1);
  const paginatedPrs = prs.slice((prPage - 1) * PR_PAGE_SIZE, prPage * PR_PAGE_SIZE);

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200 }}>

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Vue d'ensemble de votre flotte d'agents</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <StatCard
          label="Sessions actives"
          value={active.length}
          accent="var(--cyan)"
          sub={active.length > 0 ? '● En cours' : 'Aucune'}
        />
        <StatCard
          label="Terminées aujourd'hui"
          value={completedToday.length}
          accent="var(--lime)"
        />
        <StatCard
          label="PRs ouvertes"
          value={openPRs.length}
          accent="var(--cyan)"
          sub={prs.length > 0 ? `${prs.length} PR${prs.length > 1 ? 's' : ''} au total` : undefined}
        />
        <div className="card" style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Sessions totales
          </p>
          <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {sessions.length}
            <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400 }}> / 15</span>
          </p>
          <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((sessions.length / 15) * 100, 100)}%`, background: 'var(--lime)', borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Chart + Active agents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1rem' }}>
        <div className="card">
          <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Activité des sessions — 7 derniers jours</p>
          {sessions.length === 0
            ? <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '1.5rem 0' }}>Aucune session cette semaine</p>
            : <LineChart data={chartData} labels={chartLabels} />
          }
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
                  <p style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.title || s.localDescription}
                  </p>
                  <div style={{ marginTop: 8, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                    <div className="pulse" style={{ height: '100%', width: '60%', background: 'var(--cyan)', borderRadius: 1 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRs table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 600 }}>Pull Requests</p>
        </div>
        {prs.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '2.5rem' }}>
            Aucune PR — les PRs apparaissent ici quand Jules en ouvre une
          </p>
        ) : (
          <>
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Repo</th>
                <th>Statut</th>
                <th>Temps</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPrs.map((pr, i) => (
                <tr key={i}>
                  <td
                    style={{ color: pr.url ? 'var(--cyan)' : 'var(--text)', fontWeight: 500, cursor: pr.url ? 'pointer' : 'default' }}
                    onClick={() => pr.url && julesService.openExternal(pr.url)}
                  >
                    {pr.title}
                    {pr.url && <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.6 }}>↗</span>}
                  </td>
                  <td style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: 12 }}>{pr.repo}</td>
                  <td>
                    <span className={`badge ${PR_BADGE[pr.state ?? ''] ?? 'badge-cyan'}`}>
                      {PR_LABEL[pr.state ?? ''] ?? 'Open'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>il y a {timeAgo(pr.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={prPage} pageSize={PR_PAGE_SIZE} total={prs.length} onChange={setPrPage} />
          </>
        )}
      </div>
    </div>
  );
}
