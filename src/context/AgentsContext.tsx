import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { JulesSource, LocalSession, CreateSessionRequest, SessionState, LogEntry } from '../types/jules';
import { julesService } from '../services/julesService';

interface AgentsContextValue {
  sources:              JulesSource[];
  sessions:             LocalSession[];
  loadingSources:       boolean;
  creatingSession:      boolean;
  error:                string | null;
  fetchSources:         () => Promise<void>;
  createSession:        (req: CreateSessionRequest) => Promise<void>;
  approveSessionPlan:   (sessionName: string) => Promise<void>;
  sendSessionMessage:   (sessionName: string, prompt: string) => Promise<void>;
}

const AgentsContext = createContext<AgentsContextValue | null>(null);

const ACTIVE_STATES: SessionState[]   = ['QUEUED', 'PLANNING', 'AWAITING_PLAN_APPROVAL', 'AWAITING_USER_FEEDBACK', 'IN_PROGRESS'];
const TERMINAL_STATES: SessionState[] = ['COMPLETED', 'FAILED'];

function sourceDisplayName(source: JulesSource): string {
  if (source.githubRepo) return `${source.githubRepo.owner}/${source.githubRepo.repo}`;
  return source.id || source.name;
}

function makeLogEntry(session: LocalSession, state: SessionState): LogEntry {
  return {
    time:    new Date().toISOString(),
    level:   state === 'FAILED' ? 'ERROR' : 'INFO',
    source:  session.sourceDisplayName,
    state,
    message: `[${state}] ${session.localDescription}`,
  };
}

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [sources, setSources]               = useState<JulesSource[]>([]);
  const [sessions, setSessions]             = useState<LocalSession[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [creatingSession, setCreating]      = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const saveTimerRef                        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef                      = useRef(false);

  // Debounced disk write — triggered whenever sessions change after first load
  useEffect(() => {
    if (!initializedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      julesService.writeSessions(sessions).catch(() => {});
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [sessions]);

  // Charge depuis le disque, puis fusionne avec l'API
  useEffect(() => {
    async function init() {
      // 1. Disk first — instant display of previously known sessions
      let diskSessions: LocalSession[] = [];
      try { diskSessions = await julesService.readSessions(); } catch {}
      if (diskSessions.length > 0) setSessions(diskSessions);
      initializedRef.current = true;

      // 2. Merge API sessions — add any unknowns at the top
      try {
        const result = await julesService.listSessions();
        const apiSessions = result.sessions ?? [];
        if (apiSessions.length === 0) return;
        setSessions(prev => {
          const existingNames = new Set(prev.map(s => s.name));
          const incoming: LocalSession[] = apiSessions
            .filter(s => !existingNames.has(s.name))
            .map(s => ({
              ...s,
              state:             s.state      ?? 'STATE_UNSPECIFIED',
              createTime:        s.createTime ?? new Date().toISOString(),
              localDescription:  s.prompt     ?? s.title ?? '',
              sourceDisplayName: s.sourceContext?.source ?? s.name,
            }));
          return incoming.length > 0 ? [...incoming, ...prev] : prev;
        });
      } catch {}
    }
    init();
  }, []);

  const fetchSources = useCallback(async () => {
    setLoadingSources(true);
    setError(null);
    try {
      const result = await julesService.getSources();
      setSources(result.sources ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur inconnue');
    } finally {
      setLoadingSources(false);
    }
  }, []);

  const createSession = useCallback(async (req: CreateSessionRequest) => {
    setCreating(true);
    setError(null);
    try {
      const session = await julesService.createSession(req);
      const source  = sources.find(s => s.name === req.sourceName);
      const local: LocalSession = {
        ...session,
        state:             session.state     ?? 'QUEUED',
        createTime:        session.createTime ?? new Date().toISOString(),
        localDescription:  req.description,
        sourceDisplayName: source ? sourceDisplayName(source) : req.sourceName,
      };
      setSessions(prev => [local, ...prev]);
      julesService.appendLog(makeLogEntry(local, local.state)).catch(() => {});
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors du lancement');
    } finally {
      setCreating(false);
    }
  }, [sources]);

  const approveSessionPlan = useCallback(async (sessionName: string) => {
    setError(null);
    try {
      await julesService.approvePlan(sessionName);
      setSessions(prev => prev.map(s => {
        if (s.name !== sessionName) return s;
        const updated = { ...s, state: 'IN_PROGRESS' as SessionState };
        julesService.appendLog(makeLogEntry(updated, 'IN_PROGRESS')).catch(() => {});
        return updated;
      }));
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de l\'approbation');
    }
  }, []);

  const sendSessionMessage = useCallback(async (sessionName: string, prompt: string) => {
    setError(null);
    try {
      await julesService.sendMessage(sessionName, prompt);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de l\'envoi du message');
    }
  }, []);

  // Polling toutes les 10s — notification OS sur transition vers état terminal
  useEffect(() => {
    const active = sessions.filter(s => ACTIVE_STATES.includes(s.state));
    if (active.length === 0) return;

    const id = setInterval(() => {
      active.forEach(async s => {
        try {
          const updated = await julesService.getSession(s.name);
          setSessions(prev => prev.map(existing => {
            if (existing.name !== s.name) return existing;
            if (updated.state && updated.state !== existing.state) {
              const merged = { ...existing, ...updated };
              julesService.appendLog(makeLogEntry(merged, updated.state!)).catch(() => {});
              if (TERMINAL_STATES.includes(updated.state)) {
                const title = updated.state === 'COMPLETED' ? '✓ Session terminée' : '✗ Session échouée';
                julesService.notify(title, existing.localDescription).catch(() => {});
              }
              return merged;
            }
            return { ...existing, ...updated };
          }));
        } catch {
          // Silencieux — on réessaie au prochain tick
        }
      });
    }, 10_000);

    return () => clearInterval(id);
  }, [sessions]);

  return (
    <AgentsContext.Provider value={{
      sources, sessions, loadingSources, creatingSession, error,
      fetchSources, createSession, approveSessionPlan, sendSessionMessage,
    }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  const ctx = useContext(AgentsContext);
  if (!ctx) throw new Error('useAgents doit être utilisé dans AgentsProvider');
  return ctx;
}
