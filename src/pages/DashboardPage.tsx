import { useState, useEffect, useRef } from 'react';
import { ExternalLink, GitPullRequest, GitMerge, XCircle, ChevronDown } from 'lucide-react';
import { useAgents } from '../context/AgentsContext';
import { julesService } from '../services/julesService';
import type { LocalSession } from '../types/jules';
import Pagination from '../components/Pagination';
import { ACTIVE_STATES } from '../constants/session';
import { timeAgo } from '../utils/format';

const PR_PAGE_SIZE = 5;

// ── PR status (manuel, persisté localement) ────────────────────────────────────

type PRStatus = 'open' | 'merged' | 'closed';

const PR_STATUS_META: Record<PRStatus, { label: string; badge: string; Icon: typeof GitPullRequest }> = {
  open:   { label: 'Ouverte', badge: 'badge-cyan', Icon: GitPullRequest },
  merged: { label: 'Merged',  badge: 'badge-lime', Icon: GitMerge       },
  closed: { label: 'Fermée',  badge: 'badge-red',  Icon: XCircle        },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildChartData(sessions: LocalSession[]): number[] {
  const counts = Array(7).fill(0);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  sessions.forEach(s => {
    const day = new Date(s.createTime);
    day.setHours(0, 0, 0, 0);
    const diffDays = Math.round((todayStart.getTime() - day.getTime()) / 86_400_000);
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

function buildPRList(sessions: LocalSession[]) {
  return sessions.flatMap(s => {
    const pr = s.outputs?.find(o => o.pullRequest)?.pullRequest;
    if (!pr) return [];
    return [{
      title: pr.title || s.title || s.localDescription,
      repo:  s.sourceDisplayName,
      url:   pr.url,
      time:  s.updateTime || s.createTime,
      state: s.state,
    }];
  });
}

function PRStatusBadge({ status, onChange }: { status: PRStatus; onChange: (next: PRStatus) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const meta = PR_STATUS_META[status];
  const { Icon } = meta;

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className={`badge ${meta.badge}`}
        style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        title="Cliquer pour changer le statut"
      >
        <Icon size={11} strokeWidth={2} />
        {meta.label}
        <ChevronDown size={10} strokeWidth={2} style={{ opacity: 0.7 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0.25rem 0',
          minWidth: 130,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 50,
        }}>
          {(Object.keys(PR_STATUS_META) as PRStatus[]).map(s => {
            const m = PR_STATUS_META[s];
            const SIcon = m.Icon;
            const isCurrent = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={e => { e.stopPropagation(); onChange(s); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '0.4rem 0.75rem',
                  background: isCurrent ? 'var(--s2)' : 'transparent',
                  color: 'var(--text)', fontSize: 12, textAlign: 'left',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <SIcon size={12} strokeWidth={2} />
                {m.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  const [prStatuses, setPrStatuses] = useState<Record<string, PRStatus>>({});

  useEffect(() => {
    julesService.readPrefs().then(prefs => {
      const stored = prefs.prStatuses;
      if (stored && typeof stored === 'object') {
        setPrStatuses(stored as Record<string, PRStatus>);
      }
    }).catch(() => {});
  }, []);

  const setPrStatus = (url: string, next: PRStatus) => {
    setPrStatuses(prev => {
      const updated = { ...prev, [url]: next };
      julesService.readPrefs().then(prefs =>
        julesService.writePrefs({ ...prefs, prStatuses: updated })
      ).catch(() => {});
      return updated;
    });
  };

  const statusFor = (url: string): PRStatus => prStatuses[url] ?? 'open';
  const openPRs   = prs.filter(p => p.url && statusFor(p.url) === 'open');

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
          sub={active.length > 0 ? 'En cours' : 'Aucune'}
        />
        <div className="card" style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Terminées aujourd'hui
          </p>
          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--lime)', letterSpacing: '-0.02em' }}>
            {completedToday.length}
            <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400 }}> / 15</span>
          </p>
          <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((completedToday.length / 15) * 100, 100)}%`, background: 'var(--lime)', borderRadius: 2 }} />
          </div>
        </div>
        <StatCard
          label="PRs ouvertes"
          value={openPRs.length}
          accent="var(--cyan)"
          sub={prs.length > 0 ? `${prs.length} PR${prs.length > 1 ? 's' : ''} au total` : undefined}
        />
        <StatCard
          label="Sessions totales"
          value={sessions.length}
          accent="var(--text)"
        />
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
                    <span className="badge badge-cyan"><span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 4 }} /> {s.state}</span>
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {pr.title}
                      {pr.url && <ExternalLink size={11} strokeWidth={2} style={{ opacity: 0.5 }} />}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: 12 }}>{pr.repo}</td>
                  <td onClick={e => e.stopPropagation()}>
                    {pr.url
                      ? <PRStatusBadge status={statusFor(pr.url)} onChange={next => setPrStatus(pr.url!, next)} />
                      : <span className="badge badge-gray">—</span>
                    }
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
