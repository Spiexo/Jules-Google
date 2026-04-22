function pageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

const BTN: React.CSSProperties = {
  minWidth: 28,
  height: 28,
  padding: '0 6px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--muted)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const BTN_ACTIVE: React.CSSProperties = {
  ...BTN,
  background: 'var(--lime)',
  color: '#000',
  border: 'none',
};

const BTN_DISABLED: React.CSSProperties = {
  ...BTN,
  opacity: 0.3,
  cursor: 'not-allowed',
};

interface PaginationProps {
  page:     number;
  pageSize: number;
  total:    number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.65rem 1rem',
      borderTop: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
        {from}–{to} sur {total}
      </span>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          style={page === 1 ? BTN_DISABLED : BTN}
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          ←
        </button>

        {pageNumbers(page, totalPages).map((p, i) =>
          p === '...'
            ? <span key={`ellipsis-${i}`} style={{ fontSize: 12, color: 'var(--muted)', padding: '0 2px' }}>…</span>
            : <button
                key={p}
                style={p === page ? BTN_ACTIVE : BTN}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
        )}

        <button
          style={page === totalPages ? BTN_DISABLED : BTN}
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          →
        </button>
      </div>
    </div>
  );
}
