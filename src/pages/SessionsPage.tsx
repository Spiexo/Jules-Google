import React, { useEffect, useRef, useState } from 'react';
import { useAgents } from '../context/AgentsContext';
import { julesService } from '../services/julesService';
import type { AutomationMode, LocalSession } from '../types/jules';
import Pagination from '../components/Pagination';
import { ACTIVE_STATES, STATE_LABEL } from '../constants/session';
import { timeAgo } from '../utils/format';

const SESSIONS_PAGE_SIZE = 10;

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

function setAutomationMode(sourceId: string, mode: AutomationMode) {
  localStorage.setItem(`jules_automation_${sourceId}`, mode);
}

interface ImageAttachButtonProps { onSelect: (file: File, preview: string) => void; }

function ImageAttachButton({ onSelect }: ImageAttachButtonProps) {
  const [open, setOpen]   = useState(false);
  const fileRef           = useRef<HTMLInputElement>(null);
  const wrapRef           = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { onSelect(file, reader.result as string); setOpen(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: 30, height: 30,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: open ? 'var(--s2)' : 'transparent',
          color: 'var(--muted)',
          fontSize: 18, lineHeight: 1,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Joindre une image"
      >
        +
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: 0,
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '0.35rem 0',
          minWidth: 180,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 50,
        }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '0.5rem 0.85rem',
              background: 'transparent', color: 'var(--text)',
              fontSize: 13, textAlign: 'left', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16 }}>🖼</span>
            Importer une image
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}

function SessionRow({ session, onApprove, onReply, onView }: {
  session: LocalSession;
  onApprove: () => void;
  onReply: () => void;
  onView: () => void;
}) {
  const pr = session.outputs?.[0]?.pullRequest;
  const isActive = ACTIVE_STATES.includes(session.state);

  return (
    <div style={{
      padding: '0.85rem 1rem',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.title || session.localDescription}
        </p>
        {session.title && (
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.localDescription}
          </p>
        )}
      </div>

      <span className={`badge ${STATE_BADGE[session.state] ?? 'badge-gray'}`}>
        {isActive && session.state !== 'AWAITING_PLAN_APPROVAL' && session.state !== 'AWAITING_USER_FEEDBACK' && (
          <span className="pulse">●</span>
        )}
        {STATE_LABEL[session.state] ?? session.state}
      </span>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {session.state === 'AWAITING_PLAN_APPROVAL' && (
          <button className="btn-primary" style={{ fontSize: 11, padding: '0.25rem 0.65rem' }} onClick={onApprove}>
            ✓ Approuver
          </button>
        )}
        <button className="btn-ghost" style={{ fontSize: 11, padding: '0.25rem 0.65rem' }} onClick={onView}>
          → Voir
        </button>
        {isActive && (
          <button className="btn-ghost" style={{ fontSize: 11, padding: '0.25rem 0.65rem' }} onClick={onReply}>
            ✉ Répondre
          </button>
        )}
        {pr && (
          <button
            className="btn-ghost"
            style={{ fontSize: 11, padding: '0.25rem 0.65rem' }}
            onClick={() => julesService.openExternal(pr.url)}
          >
            ↗ PR
          </button>
        )}
        {session.url && (
          <button
            className="btn-ghost"
            style={{ fontSize: 11, padding: '0.25rem 0.65rem' }}
            onClick={() => session.url && julesService.openExternal(session.url)}
          >
            ↗ Jules
          </button>
        )}
      </div>

      <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, width: 48, textAlign: 'right' }}>
        {timeAgo(session.createTime)}
      </span>
    </div>
  );
}

export default function SessionsPage({ onSelectSession }: { onSelectSession: (name: string) => void }) {
  const { sources, sessions, loadingSources, creatingSession, error, fetchSources, createSession, approveSessionPlan, sendSessionMessage } = useAgents();

  const [selectedSource, setSelectedSource]   = useState<string | null>(null);
  const [replySession, setReplySession]        = useState<string | null>(null);
  const [replyText, setReplyText]              = useState('');
  const [replyImage, setReplyImage]            = useState<{ file: File; preview: string } | null>(null);
  const [replySending, setReplySending]        = useState(false);
  const [showModal, setShowModal]              = useState(false);
  const [automationModes, setAutomationModes] = useState<Record<string, AutomationMode>>(() => {
    const result: Record<string, AutomationMode> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('jules_automation_')) {
        const sourceId = key.replace('jules_automation_', '');
        result[sourceId] = localStorage.getItem(key) as AutomationMode;
      }
    }
    return result;
  });

  const [modalSource, setModalSource]           = useState('');
  const [modalBranch, setModalBranch]           = useState('');
  const [modalPrompt, setModalPrompt]           = useState('');
  const [modalTitle, setModalTitle]             = useState('');
  const [modalRequirePlan, setModalRequirePlan] = useState(false);
  const [modalImage, setModalImage]             = useState<{ file: File; preview: string } | null>(null);

  useEffect(() => {
    if (sources.length === 0) fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    if (selectedSource && showModal) setModalSource(selectedSource);
  }, [selectedSource, showModal]);

  useEffect(() => {
    const src = sources.find(s => s.name === modalSource);
    const defaultBranch = src?.githubRepo?.defaultBranch?.displayName ?? 'main';
    setModalBranch(defaultBranch);
  }, [modalSource, sources]);

  function displayNameFor(sourceName: string): string {
    const src = sources.find(s => s.name === sourceName);
    return src?.githubRepo ? `${src.githubRepo.owner}/${src.githubRepo.repo}` : sourceName;
  }

  const filteredSessions = selectedSource
    ? sessions.filter(s => s.sourceContext?.source === selectedSource || s.sourceDisplayName === displayNameFor(selectedSource))
    : sessions;

  const [sessionsPage, setSessionsPage] = useState(1);
  useEffect(() => { setSessionsPage(1); }, [selectedSource]);
  const paginatedSessions = filteredSessions.slice((sessionsPage - 1) * SESSIONS_PAGE_SIZE, sessionsPage * SESSIONS_PAGE_SIZE);

  const handleApprove = async (sessionName: string) => {
    await approveSessionPlan(sessionName);
  };

  const handleReply = async (sessionName: string) => {
    if (!replyText.trim()) return;
    setReplySending(true);
    await sendSessionMessage(sessionName, replyText.trim());
    setReplyText('');
    setReplyImage(null);
    setReplySession(null);
    setReplySending(false);
  };

  const handleModalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!modalSource || !modalPrompt.trim()) return;
    const src = sources.find(s => s.name === modalSource);
    const automationMode = src ? (automationModes[src.id] ?? 'AUTOMATION_MODE_UNSPECIFIED') : 'AUTOMATION_MODE_UNSPECIFIED';
    await createSession({
      sourceName:          modalSource,
      description:         modalPrompt.trim(),
      startingBranch:      modalBranch || 'main',
      requirePlanApproval: modalRequirePlan,
      automationMode,
      ...(modalTitle.trim() && { title: modalTitle.trim() }),
    });
    setShowModal(false);
    setModalPrompt('');
    setModalTitle('');
    setModalRequirePlan(false);
    setModalImage(null);
  };

  const modalSrc     = sources.find(s => s.name === modalSource);
  const modalBranches = modalSrc?.githubRepo?.branches ?? [];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Sessions</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Dépôts GitHub connectés à Jules</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={fetchSources} disabled={loadingSources}>
            {loadingSources ? '...' : '↻ Actualiser'}
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Nouvelle session
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: 'var(--red)', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 6 }}>
          ✗ {error}
        </p>
      )}

      {!loadingSources && sources.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Aucun dépôt connecté</p>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
            Configurez votre clé API dans les paramètres puis actualisez
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {sources.map(source => {
            const displayName    = source.githubRepo
              ? `${source.githubRepo.owner}/${source.githubRepo.repo}`
              : source.id || source.name;
            const sourceSessions = sessions.filter(s => s.sourceContext?.source === source.name || s.sourceDisplayName === displayName);
            const activeSessions = sourceSessions.filter(s => ACTIVE_STATES.includes(s.state));
            const isSelected     = selectedSource === source.name;
            const isAutoOn       = (automationModes[source.id] ?? 'AUTOMATION_MODE_UNSPECIFIED') === 'AUTO_CREATE_PR';

            return (
              <div
                key={source.name}
                onClick={() => setSelectedSource(isSelected ? null : source.name)}
                style={{
                  padding: '1rem',
                  borderRadius: 12,
                  border: `1px solid ${isSelected ? 'var(--lime)' : 'var(--border)'}`,
                  background: isSelected ? 'rgba(163,230,53,0.05)' : 'var(--s1)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </p>
                    {source.githubRepo?.defaultBranch && (
                      <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, fontFamily: 'monospace' }}>
                        ⎇ {source.githubRepo.defaultBranch.displayName}
                      </p>
                    )}
                  </div>
                  {activeSessions.length > 0
                    ? <span className="badge badge-cyan" style={{ flexShrink: 0 }}><span className="pulse">●</span> {activeSessions.length}</span>
                    : <span className="badge badge-gray" style={{ flexShrink: 0 }}>{sourceSessions.length}</span>
                  }
                </div>

                <div
                  onClick={e => {
                    e.stopPropagation();
                    const next: AutomationMode = isAutoOn ? 'AUTOMATION_MODE_UNSPECIFIED' : 'AUTO_CREATE_PR';
                    setAutomationMode(source.id, next);
                    setAutomationModes(prev => ({ ...prev, [source.id]: next }));
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}
                >
                  <div style={{
                    width: 28,
                    height: 16,
                    borderRadius: 8,
                    background: isAutoOn ? 'var(--lime)' : 'var(--border)',
                    position: 'relative',
                    flexShrink: 0,
                    transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      left: isAutoOn ? 14 : 2,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: isAutoOn ? '#000' : '#555',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: isAutoOn ? 'var(--lime)' : 'var(--muted)' }}>
                    Auto-PR
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(sources.length > 0 || sessions.length > 0) && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: 13 }}>
              {selectedSource ? `Sessions — ${displayNameFor(selectedSource)}` : 'Toutes les sessions'}
            </p>
            {selectedSource && (
              <button className="btn-ghost" style={{ fontSize: 11, padding: '0.2rem 0.6rem' }} onClick={() => setSelectedSource(null)}>
                ✕ Effacer le filtre
              </button>
            )}
          </div>

          {filteredSessions.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2.5rem', fontSize: 13 }}>
              Aucune session
            </p>
          ) : (
            paginatedSessions.map(s => (
              <div key={s.name}>
                <SessionRow
                  session={s}
                  onApprove={() => handleApprove(s.name)}
                  onReply={() => setReplySession(replySession === s.name ? null : s.name)}
                  onView={() => onSelectSession(s.name)}
                />
                {replySession === s.name && (
                  <div style={{ padding: '0.75rem 1rem', background: 'var(--s2)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {replyImage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={replyImage.preview}
                          alt={replyImage.file.name}
                          style={{ height: 48, borderRadius: 6, border: '1px solid var(--border)', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: 12, color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {replyImage.file.name}
                        </span>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: 11, padding: '0.1rem 0.4rem' }}
                          onClick={() => setReplyImage(null)}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <ImageAttachButton onSelect={(file, preview) => setReplyImage({ file, preview })} />
                      <input
                        autoFocus
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleReply(s.name)}
                        placeholder="Votre réponse à Jules..."
                        style={{ flex: 1, fontSize: 13 }}
                      />
                      <button
                        className="btn-primary"
                        style={{ fontSize: 12 }}
                        disabled={!replyText.trim() || replySending}
                        onClick={() => handleReply(s.name)}
                      >
                        {replySending ? '...' : 'Envoyer'}
                      </button>
                      <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setReplySession(null); setReplyImage(null); }}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <Pagination page={sessionsPage} pageSize={SESSIONS_PAGE_SIZE} total={filteredSessions.length} onChange={setSessionsPage} />
        </div>
      )}

      {showModal && (
        <div
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div className="card" style={{ width: 480, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <p style={{ fontWeight: 700, fontSize: 15 }}>Nouvelle session</p>
              <button className="btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: 14 }} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Dépôt</label>
                <select value={modalSource} onChange={e => setModalSource(e.target.value)} style={{ width: '100%' }}>
                  <option value="" disabled>Sélectionner un dépôt</option>
                  {sources.map(s => (
                    <option key={s.name} value={s.name}>
                      {s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : s.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Branche de départ</label>
                {modalBranches.length > 0 ? (
                  <select value={modalBranch} onChange={e => setModalBranch(e.target.value)} style={{ width: '100%' }}>
                    {modalBranches.map(b => (
                      <option key={b.displayName} value={b.displayName}>{b.displayName}</option>
                    ))}
                  </select>
                ) : (
                  <input value={modalBranch} onChange={e => setModalBranch(e.target.value)} placeholder="main" />
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Titre <span style={{ opacity: 0.5 }}>(optionnel)</span>
                </label>
                <input value={modalTitle} onChange={e => setModalTitle(e.target.value)} placeholder="Ex : Ajouter des tests d'intégration" />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Tâche à effectuer <span style={{ color: 'var(--red)' }}>*</span></label>
                <textarea
                  value={modalPrompt}
                  onChange={e => setModalPrompt(e.target.value)}
                  placeholder="Décris précisément ce que Jules doit faire..."
                  rows={4}
                />
                {modalImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <img
                      src={modalImage.preview}
                      alt={modalImage.file.name}
                      style={{ height: 48, borderRadius: 6, border: '1px solid var(--border)', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {modalImage.file.name}
                    </span>
                    <button type="button" className="btn-ghost" style={{ fontSize: 11, padding: '0.1rem 0.4rem' }} onClick={() => setModalImage(null)}>✕</button>
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <ImageAttachButton onSelect={(file, preview) => setModalImage({ file, preview })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={modalRequirePlan}
                    onChange={e => setModalRequirePlan(e.target.checked)}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  Approbation du plan requise
                </label>
              </div>

              {error && <p style={{ fontSize: 12, color: 'var(--red)' }}>✗ {error}</p>}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn-ghost" onClick={() => { setShowModal(false); setModalImage(null); }}>Annuler</button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!modalSource || !modalPrompt.trim() || creatingSession}
                >
                  {creatingSession ? '⟳ Lancement...' : '⚡ Lancer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
