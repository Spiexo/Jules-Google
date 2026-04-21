const MOCK_PIPELINES = [
  {
    name: 'CI / Tests + Lint',
    repo: 'tradingview-clone',
    steps: ['Checkout', 'Install', 'Lint', 'Test', 'Build'],
    status: 'success',
    duration: '2m 14s',
    completedSteps: 5,
  },
  {
    name: 'Deploy Preview',
    repo: 'tradingview-clone',
    steps: ['Build', 'Upload', 'DNS', 'Check'],
    status: 'running',
    duration: '45s',
    completedSteps: 2,
  },
  {
    name: 'Jules PR Workflow',
    repo: 'TEST-Jules',
    steps: ['Plan', 'Implement', 'Test', 'PR'],
    status: 'pending',
    duration: '—',
    completedSteps: 0,
  },
];

const STATUS_MAP: Record<string, { badge: string; label: string }> = {
  success: { badge: 'badge-lime',   label: 'Succès'     },
  running: { badge: 'badge-cyan',   label: 'En cours'   },
  failed:  { badge: 'badge-red',    label: 'Échec'      },
  pending: { badge: 'badge-gray',   label: 'En attente' },
};

export default function PipelinesPage() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Pipelines</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Flux d'exécution automatisés</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {MOCK_PIPELINES.map((pipeline, i) => {
          const st = STATUS_MAP[pipeline.status] ?? STATUS_MAP.pending;

          return (
            <div key={i} className="card">
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{pipeline.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'monospace' }}>{pipeline.repo}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{pipeline.duration}</span>
                  <span className={`badge ${st.badge}`}>
                    {pipeline.status === 'running' && <span className="pulse">●</span>}
                    {st.label}
                  </span>
                </div>
              </div>

              {/* Step flow */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {pipeline.steps.map((step, j) => {
                  const isDone   = j < pipeline.completedSteps;
                  const isActive = pipeline.status === 'running' && j === pipeline.completedSteps;

                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 500,
                        background: isDone   ? 'rgba(163,230,53,0.1)'
                                  : isActive ? 'rgba(34,211,238,0.1)'
                                  :             'var(--s2)',
                        color:     isDone   ? 'var(--lime)'
                                 : isActive ? 'var(--cyan)'
                                 :             'var(--muted)',
                        border: `1px solid ${isDone   ? 'rgba(163,230,53,0.2)'
                                           : isActive ? 'rgba(34,211,238,0.2)'
                                           :             'var(--border)'}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {isDone ? '✓ ' : isActive ? <span className="spin" style={{ marginRight: 4 }}>⟳</span> : null}
                        {step}
                      </div>
                      {j < pipeline.steps.length - 1 && (
                        <div style={{
                          width: 20,
                          height: 1,
                          background: isDone ? 'var(--lime)' : 'var(--border)',
                          flexShrink: 0,
                          opacity: isDone ? 0.5 : 0.3,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
