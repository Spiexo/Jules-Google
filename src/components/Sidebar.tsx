type Page = 'dashboard' | 'sessions' | 'agents' | 'pipelines' | 'logs' | 'settings';

interface NavItem { id: Page; icon: string; label: string; }

const NAV: NavItem[] = [
  { id: 'dashboard', icon: '▣',  label: 'Dashboard'  },
  { id: 'sessions',  icon: '⚡', label: 'Sessions'   },
  { id: 'agents',    icon: '🤖', label: 'Agents'     },
  { id: 'pipelines', icon: '⛓', label: 'Pipelines'  },
  { id: 'logs',      icon: '▤',  label: 'Logs'       },
];

interface Props { active: Page; onNavigate: (p: Page) => void; }

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: '#0d0d0d',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: 18, color: 'var(--lime)', lineHeight: 1 }}>⚡</span>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--text)' }}>
            Jules Controller
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 0.75rem' }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.55rem 0.75rem',
                borderRadius: 8,
                background: isActive ? 'rgba(163,230,53,0.08)' : 'transparent',
                color: isActive ? 'var(--lime)' : 'var(--muted)',
                borderLeft: isActive ? '2px solid var(--lime)' : '2px solid transparent',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isActive ? '0 0 12px rgba(163,230,53,0.08)' : 'none',
              }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Settings */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
        <button
          onClick={() => onNavigate('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 8,
            background: active === 'settings' ? 'rgba(163,230,53,0.08)' : 'transparent',
            color: active === 'settings' ? 'var(--lime)' : 'var(--muted)',
            borderLeft: active === 'settings' ? '2px solid var(--lime)' : '2px solid transparent',
            fontSize: 13,
            width: '100%',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>⚙</span>
          Settings
        </button>
      </div>
    </aside>
  );
}
