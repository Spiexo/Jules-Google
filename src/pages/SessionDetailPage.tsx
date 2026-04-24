import { useEffect, useRef, useState } from 'react';
import { useAgents } from '../context/AgentsContext';
import { julesService } from '../services/julesService';
import type { Activity } from '../types/jules';
import { ACTIVE_STATES, STATE_LABEL } from '../constants/session';
import { timeAgo } from '../utils/format';

const STATE_BADGE: Record<string, string> = {
  QUEUED:                 'badge-cyan',
  PLANNING:               'badge-cyan',
  IN_PROGRESS:            'badge-lime',
  AWAITING_PLAN_APPROVAL: 'badge-orange',
  AWAITING_USER_FEEDBACK: 'badge-orange',
  COMPLETED:              'badge-lime',
  FAILED:                 'badge-red',
  PAUSED:                 'badge-gray',
  STATE_UNSPECIFIED:      'badge-gray',
};

// ── Activity items ─────────────────────────────────────────────────────────────

function UserBubble({ text, time }: { text: string; time: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(163,230,53,0.1)', border: '1px solid var(--lime)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: 'var(--lime)', fontWeight: 700,
      }}>V</div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{timeAgo(time)}</p>
        <div style={{
          background: 'rgba(163,230,53,0.07)', border: '1px solid rgba(163,230,53,0.2)',
          borderRadius: 10, borderTopRightRadius: 2,
          padding: '0.6rem 0.85rem', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.5,
          maxWidth: '80%',
        }}>
          {text}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ a }: { a: Activity }) {
  if (a.agentMessaged) return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(6,182,212,0.1)', border: '1px solid var(--cyan)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: 'var(--cyan)', fontWeight: 700,
      }}>J</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: 'var(--cyan)', marginBottom: 4 }}>Jules · {timeAgo(a.createTime)}</p>
        <div style={{
          background: 'var(--s1)', border: '1px solid var(--border)',
          borderRadius: 10, borderTopLeftRadius: 2,
          padding: '0.6rem 0.85rem', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.5,
        }}>
          {a.agentMessaged.agentMessage}
        </div>
      </div>
    </div>
  );

  // userMessaged champ explicite
  if (a.userMessaged) return <UserBubble text={a.userMessaged.userMessage} time={a.createTime} />;

  // Jules peut aussi stocker les messages utilisateur dans description avec originator='user'
  if (a.originator === 'user' && a.description?.trim()) return <UserBubble text={a.description} time={a.createTime} />;

  if (a.planGenerated) {
    const { steps } = a.planGenerated.plan;
    return (
      <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.85rem 1rem' }}>
        <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>📋 Plan généré</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map(step => (
            <div key={step.id} style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', width: 18, flexShrink: 0, marginTop: 1, textAlign: 'right' }}>{step.index}.</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>{step.title}</p>
                {step.description && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{step.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Ignorer les progressUpdated sans titre — évite les ronds gris vides
  if (a.progressUpdated) {
    const title = a.progressUpdated.title?.trim();
    if (!title) return null;
    return (
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--s1)', border: '1px solid var(--border)', padding: '0.25rem 0.85rem', borderRadius: 99 }}>
          {title}
        </span>
      </div>
    );
  }

  if (a.planApproved) return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--lime)', background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.2)', padding: '0.25rem 0.85rem', borderRadius: 99 }}>
        ✓ Plan approuvé
      </span>
    </div>
  );

  if (a.sessionCompleted) return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--lime)', background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.2)', padding: '0.35rem 1.25rem', borderRadius: 99 }}>
        ✓ Session terminée
      </span>
    </div>
  );

  if (a.sessionFailed) return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.35rem 1.25rem', borderRadius: 99 }}>
        ✗ Échouée — {a.sessionFailed.reason}
      </span>
    </div>
  );

  // Fallback: description générique
  if (a.description) return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{a.description}</span>
    </div>
  );

  return null;
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface Props {
  sessionName: string;
  onBack: () => void;
}

export default function SessionDetailPage({ sessionName, onBack }: Props) {
  const { sessions, approveSessionPlan, sendSessionMessage } = useAgents();
  const session  = sessions.find(s => s.name === sessionName);
  const isActive = session ? ACTIVE_STATES.includes(session.state) : false;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]       = useState(true);
  const [replyText, setReplyText]   = useState('');
  const [sending, setSending]       = useState(false);
  const scrollRef                   = useRef<HTMLDivElement>(null);

  const loadActivities = () =>
    julesService.listActivities(sessionName)
      .then(r => setActivities(r.activities ?? []))
      .catch(() => {});

  useEffect(() => {
    setLoading(true);
    loadActivities().finally(() => setLoading(false));
  }, [sessionName]);

  // Poll if active
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(loadActivities, 10_000);
    return () => clearInterval(id);
  }, [isActive, sessionName]);

  // Scroll to bottom on new activities
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]);

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await sendSessionMessage(sessionName, replyText.trim());
    setReplyText('');
    setSending(false);
    await loadActivities();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '0.85rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0,
      }}>
        <button className="btn-ghost" onClick={onBack} style={{ fontSize: 12, padding: '0.3rem 0.7rem' }}>
          ← Retour
        </button>

        {session && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.title || session.localDescription}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                {session.sourceDisplayName} · {timeAgo(session.createTime)}
              </p>
            </div>

            <span className={`badge ${STATE_BADGE[session.state] ?? 'badge-gray'}`}>
              {isActive && session.state !== 'AWAITING_PLAN_APPROVAL' && <span className="pulse">●</span>}
              {STATE_LABEL[session.state] ?? session.state}
            </span>

            {session.state === 'AWAITING_PLAN_APPROVAL' && (
              <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => approveSessionPlan(sessionName)}>
                ✓ Approuver le plan
              </button>
            )}

            {session.outputs?.[0]?.pullRequest && (
              <button
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => julesService.openExternal(session.outputs![0].pullRequest!.url)}
              >
                ↗ PR
              </button>
            )}
          </>
        )}
      </div>

      {/* Activity feed */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {loading ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: 13, marginTop: '3rem' }}>Chargement...</p>
        ) : activities.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: 13, marginTop: '3rem' }}>Aucune activité pour l'instant</p>
        ) : (
          activities.map(a => <ActivityItem key={a.id} a={a} />)
        )}
      </div>

      {/* Input bar */}
      {isActive && (
        <div style={{
          padding: '0.85rem 1.5rem',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
            placeholder="Envoyer un message à Jules..."
            style={{ flex: 1, fontSize: 13 }}
          />
          <button
            className="btn-primary"
            disabled={!replyText.trim() || sending}
            onClick={handleSend}
          >
            {sending ? '...' : 'Envoyer'}
          </button>
        </div>
      )}
    </div>
  );
}
