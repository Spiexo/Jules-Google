import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ClipboardList, Check, CheckCircle2, XCircle, GitPullRequest, AlertCircle, Bot, User, Activity as ActivityIcon, Send, X } from 'lucide-react';
import ImageAttachButton from '../components/ImageAttachButton';
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

function Avatar({ kind }: { kind: 'user' | 'agent' }) {
  const isUser = kind === 'user';
  const Icon = isUser ? User : Bot;
  const color = isUser ? 'var(--lime)' : 'var(--cyan)';
  const bg    = isUser ? 'rgba(163,230,53,0.12)' : 'rgba(34,211,238,0.12)';
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: bg, border: `1px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color,
    }}>
      <Icon size={15} strokeWidth={2} />
    </div>
  );
}

function UserBubble({ text, time }: { text: string; time: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
      <Avatar kind="user" />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5, fontWeight: 500 }}>
          Vous · <span style={{ opacity: 0.7 }}>{timeAgo(time)}</span>
        </p>
        <div style={{
          background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.22)',
          borderRadius: 12, borderTopRightRadius: 3,
          padding: '0.7rem 0.95rem', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.55,
          maxWidth: '78%', color: 'var(--text)',
        }}>
          {text}
        </div>
      </div>
    </div>
  );
}

function Milestone({ children, color, Icon }: { children: React.ReactNode; color: string; Icon: typeof Check }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0.5rem 0' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${color}30)` }} />
      <span style={{
        fontSize: 12, color, fontWeight: 600,
        background: `${color}12`, border: `1px solid ${color}30`,
        padding: '0.35rem 0.85rem', borderRadius: 99,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap',
      }}>
        <Icon size={13} strokeWidth={2.2} />
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${color}30)` }} />
    </div>
  );
}

function TimelineEvent({ text, time }: { text: string; time: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingLeft: 8 }}>
      <div style={{
        width: 16, flexShrink: 0, display: 'flex', justifyContent: 'center',
        marginTop: 4,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--muted)', opacity: 0.6,
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          {text}
        </p>
        <p style={{ fontSize: 10.5, color: 'var(--muted)', opacity: 0.55, marginTop: 2 }}>
          {timeAgo(time)}
        </p>
      </div>
    </div>
  );
}

function ActivityItem({ a }: { a: Activity }) {
  if (a.agentMessaged) return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <Avatar kind="agent" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: 'var(--cyan)', marginBottom: 5, fontWeight: 500 }}>
          Jules · <span style={{ opacity: 0.7 }}>{timeAgo(a.createTime)}</span>
        </p>
        <div style={{
          background: 'var(--s1)', border: '1px solid var(--border)',
          borderRadius: 12, borderTopLeftRadius: 3,
          padding: '0.7rem 0.95rem', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.55,
          maxWidth: '85%',
        }}>
          {a.agentMessaged.agentMessage}
        </div>
      </div>
    </div>
  );

  if (a.userMessaged) return <UserBubble text={a.userMessaged.userMessage} time={a.createTime} />;
  if (a.originator === 'user' && a.description?.trim()) return <UserBubble text={a.description} time={a.createTime} />;

  if (a.planGenerated) {
    const { steps } = a.planGenerated.plan;
    return (
      <div style={{
        background: 'linear-gradient(180deg, rgba(34,211,238,0.04), var(--s1))',
        border: '1px solid var(--border)', borderLeft: '3px solid var(--cyan)',
        borderRadius: 12, padding: '1rem 1.15rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <ClipboardList size={15} strokeWidth={2} color="var(--cyan)" />
          <p style={{ fontWeight: 600, fontSize: 13.5 }}>Plan généré</p>
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
            {steps.length} étape{steps.length > 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: 'var(--cyan)',
                marginTop: 1,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{step.title}</p>
                {step.description && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (a.progressUpdated) {
    const title = a.progressUpdated.title?.trim();
    if (!title) return null;
    return <TimelineEvent text={title} time={a.createTime} />;
  }

  if (a.planApproved) return (
    <Milestone color="#a3e635" Icon={Check}>Plan approuvé</Milestone>
  );

  if (a.sessionCompleted) return (
    <Milestone color="#a3e635" Icon={CheckCircle2}>Session terminée</Milestone>
  );

  if (a.sessionFailed) return (
    <Milestone color="#ef4444" Icon={XCircle}>
      Échouée — {a.sessionFailed.reason}
    </Milestone>
  );

  // Fallback générique avec style timeline
  if (a.description) return <TimelineEvent text={a.description} time={a.createTime} />;

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
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [replyText, setReplyText]   = useState('');
  const [replyImage, setReplyImage] = useState<{ name: string; preview: string } | null>(null);
  const [sending, setSending]       = useState(false);
  const scrollRef                   = useRef<HTMLDivElement>(null);

  const loadActivities = async () => {
    try {
      const all: Activity[] = [];
      let pageToken: string | undefined;
      do {
        const r = await julesService.listActivities(sessionName, pageToken);
        all.push(...(r.activities ?? []));
        pageToken = r.nextPageToken;
      } while (pageToken);
      setActivities(all);
      setLoadError(null);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Erreur de chargement des activités');
    }
  };

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
    setReplyImage(null);
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
        <button className="btn-ghost" onClick={onBack} style={{ fontSize: 12, padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={13} strokeWidth={2} />
          Retour
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
              {isActive && session.state !== 'AWAITING_PLAN_APPROVAL' && <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 4 }} />}
              {STATE_LABEL[session.state] ?? session.state}
            </span>

            {session.state === 'AWAITING_PLAN_APPROVAL' && (
              <button className="btn-primary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => approveSessionPlan(sessionName)}>
                <Check size={13} strokeWidth={2.5} />
                Approuver le plan
              </button>
            )}

            {session.outputs?.[0]?.pullRequest && (
              <button
                className="btn-ghost"
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => julesService.openExternal(session.outputs![0].pullRequest!.url)}
              >
                <GitPullRequest size={13} strokeWidth={2} />
                PR
              </button>
            )}
          </>
        )}
      </div>

      {/* Activity feed */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', maxWidth: 900, width: '100%', margin: '0 auto' }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--muted)' }}>
            <ActivityIcon size={20} strokeWidth={2} style={{ animation: 'pulse 1.5s ease-in-out infinite', marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>Chargement de la conversation...</p>
          </div>
        ) : loadError ? (
          <div style={{
            margin: '3rem auto', maxWidth: 480,
            padding: '0.85rem 1rem', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--red)', fontSize: 13,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Impossible de charger la conversation</p>
              <p style={{ color: 'rgba(239,68,68,0.85)' }}>{loadError}</p>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--muted)' }}>
            <ActivityIcon size={24} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 10 }} />
            <p style={{ fontSize: 13 }}>Aucune activité pour l'instant</p>
          </div>
        ) : (
          activities.map(a => <ActivityItem key={a.id} a={a} />)
        )}
      </div>

      {/* Input bar — toujours visible quand une session existe */}
      {session && (
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--s1)',
          flexShrink: 0,
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {replyImage && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '0.5rem 0.6rem 0.5rem 0.5rem',
                alignSelf: 'flex-start', maxWidth: '100%',
              }}>
                <img
                  src={replyImage.preview}
                  alt={replyImage.name}
                  style={{ height: 44, width: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {replyImage.name}
                </span>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setReplyImage(null)}
                  style={{ padding: '0.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Retirer"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            )}

            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.35rem 0.4rem 0.35rem 0.4rem',
            }}>
              <ImageAttachButton
                size={32}
                onSelect={(name, preview) => setReplyImage({ name, preview })}
              />
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
                placeholder={isActive ? 'Envoyer un message à Jules...' : 'Continuer la conversation...'}
                style={{ flex: 1, fontSize: 13, background: 'transparent', border: 'none', padding: '0.4rem 0' }}
              />
              <button
                className="btn-primary"
                disabled={!replyText.trim() || sending}
                onClick={handleSend}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.85rem' }}
                title="Envoyer (Entrée)"
              >
                <Send size={13} strokeWidth={2.2} />
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
