export interface Card {
  id: string;
  title: string;
  desc?: string;
  column: string;
  priority?: 'high' | 'med' | 'low';
  assignee?: 'tobbot' | 'marko' | 'both';
  tags?: string[];
  link?: string;
  files?: string[];
  date?: string;
  comments?: Comment[];
  evidence?: Evidence[];
  sourceMessages?: string[];
  origin?: string;
}

export interface Comment {
  author: string;
  text: string;
  timestamp?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  type: 'file' | 'tag';
  name: string;
  path?: string;
  url?: string;
  ext?: string;
  rel?: string;
}

export interface Evidence {
  url: string;
  caption?: string;
}

export interface Board {
  columns: string[];
  cards: Card[];
}

export interface ChatMessage {
  messageId: string;
  author: string;
  text: string;
  timestamp?: string;
}

export interface TriageEntry {
  messageId: string;
  action: string;
  cardId?: string;
  cardTitle?: string;
  reason?: string;
}

export interface Agent {
  emoji: string;
  name: string;
  role: string;
  status: string;
  desc: string;
  type: string;
  schedule?: string;
  trigger?: string;
  lastActive?: string;
  stats?: Record<string, number | string>;
}

export interface HistoryCommit {
  hash: string;
  short: string;
  message: string;
  date: string;
  changes?: { type: string; card: string; to?: string }[];
}

export interface LogEntry {
  timestamp?: string;
  success?: boolean;
  provider: string;
  service: string;
  model: string;
  prompt?: string;
  error?: string;
  duration_ms?: number;
  image_size_bytes?: number;
  output_file?: string;
}

export interface FileResult {
  name: string;
  path: string;
  servable?: string;
  ext?: string;
  rel: string;
}

export const COL_ORDER = ['ideas', 'todo', 'progress', 'review', 'done'] as const;

export const COL_TITLES: Record<string, string> = {
  ideas: '💡 Ideas',
  todo: '📋 To Do',
  progress: '🔨 In Progress',
  review: '👀 Review',
  done: '✅ Done',
};

export const COL_COLORS: Record<string, string> = {
  ideas: '#fbbf24',
  todo: '#60a5fa',
  progress: '#7c6cff',
  review: '#fb923c',
  done: '#4ade80',
};

export const ASSIGNEE_MAP: Record<string, { cls: string; icon: string; name: string }> = {
  tobbot: { cls: 'assignee-tobbot', icon: '🤖', name: 'Tobbot' },
  marko: { cls: 'assignee-marko', icon: 'M', name: 'Marko' },
  both: { cls: 'assignee-both', icon: '⚡', name: 'Both' },
};
