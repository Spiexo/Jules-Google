export function normalizeSourceName(name: string): string {
  const parts = name.split('/');
  return parts.length >= 4 && parts[0] === 'sources' ? `${parts[2]}/${parts[3]}` : name;
}

export function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (isNaN(diff) || diff < 0) return 'à l\'instant';
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}
