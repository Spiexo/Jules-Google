import type { LocalSession } from '../types/jules';
import { timeAgo } from '../utils/format';

const STATUS: Record<string, { color: string; label: string; pulse?: boolean }> = {
  QUEUED:                 { color: '#a78bfa', label: 'En file d\'attente', pulse: true },
  PLANNING:               { color: '#60a5fa', label: 'Planification',      pulse: true },
  AWAITING_PLAN_APPROVAL: { color: '#ffa040', label: 'Plan à approuver'                },
  AWAITING_USER_FEEDBACK: { color: '#ffa040', label: 'Retour requis'                   },
  IN_PROGRESS:            { color: '#00f2fe', label: 'En cours',           pulse: true },
  PAUSED:                 { color: '#94a3b8', label: 'En pause'                        },
  COMPLETED:              { color: '#00ff88', label: 'Terminé'                         },
  FAILED:                 { color: '#ff4d4d', label: 'Échec'                           },
  STATE_UNSPECIFIED:      { color: 'rgba(255,255,255,0.35)', label: 'Inconnu'          },
};

interface SessionCardProps { session: LocalSession; }

export default function SessionCard({ session }: SessionCardProps) {
  const status = STATUS[session.state] ?? {
    color: 'rgba(255,255,255,0.35)',
    label: session.state ?? 'Inconnu',
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderLeft: `3px solid ${status.color}`,
      borderRadius: '10px',
      padding: '1rem 1.2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
    }}>
      {/* Header : repo + statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          {session.sourceDisplayName}
        </span>
        <span style={{ fontSize: '0.75rem', color: status.color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: status.color,
            display: 'inline-block',
            animation: status.pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }} />
          {status.label}
        </span>
      </div>

      {/* Description de la tâche */}
      <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', lineHeight: '1.4' }}>
        {session.localDescription}
      </p>

      {/* Footer */}
      <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.3)' }}>
        Lancé il y a {timeAgo(session.createTime)}
      </span>
    </div>
  );
}
