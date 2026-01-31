import { Card } from './types';

export function getFileIcon(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    html: '🌐', css: '🎨', js: '⚡', json: '📋', md: '📝',
    sh: '⚙️', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', pdf: '📕',
    sql: '🗃️', py: '🐍', ts: '💠',
  };
  return map[ext] || '📄';
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

export function sortCards(cards: Card[], colId: string, sortType: string): Card[] {
  const sorted = [...cards];

  const parseDate = (d?: string): number => {
    if (!d) return 0;
    const parsed = Date.parse(d + ' 2026');
    return isNaN(parsed) ? 0 : parsed;
  };

  const priorityVal: Record<string, number> = { high: 0, med: 1, low: 2 };

  switch (sortType) {
    case 'priority':
      sorted.sort((a, b) => (priorityVal[a.priority || 'med'] ?? 1) - (priorityVal[b.priority || 'med'] ?? 1));
      break;
    case 'newest':
      sorted.sort((a, b) => parseDate(b.date) - parseDate(a.date) || parseInt(b.id) - parseInt(a.id));
      break;
    case 'oldest':
      sorted.sort((a, b) => parseDate(a.date) - parseDate(b.date) || parseInt(a.id) - parseInt(b.id));
      break;
    case 'alpha':
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    default:
      break;
  }
  return sorted;
}

const TAG_COLORS: Record<string, string> = {
  infra: 'var(--blue)',
  frontend: 'var(--pink)',
  ai: 'var(--accent)',
  automation: 'var(--green)',
  design: 'var(--orange)',
  product: 'var(--yellow)',
};

export function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || 'var(--accent)';
}

const ICON_MAP: Record<string, string> = {
  '.html': '🌐', '.css': '🎨', '.js': '⚡', '.json': '📋', '.md': '📝',
  '.sh': '⚙️', '.png': '🖼️', '.jpg': '🖼️', '.pdf': '📕', '.sql': '🗃️',
};

export function getExtIcon(ext: string): string {
  return ICON_MAP[ext] || '📄';
}
