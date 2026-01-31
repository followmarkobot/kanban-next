import { Board, Card, Comment, ChatMessage, TriageEntry, Agent, HistoryCommit, LogEntry, FileResult } from './types';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchBoard(): Promise<Board> {
  const r = await fetch(`${API}/api/board`);
  return r.json();
}

export async function saveBoard(board: Board): Promise<void> {
  await fetch(`${API}/api/board`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(board),
  });
}

export async function addCard(card: Partial<Card>): Promise<Card> {
  const r = await fetch(`${API}/api/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
  return r.json();
}

export async function moveCard(id: string, column: string): Promise<void> {
  await fetch(`${API}/api/cards/${id}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column }),
  });
}

export async function deleteCard(id: string): Promise<void> {
  await fetch(`${API}/api/cards/${id}`, { method: 'DELETE' });
}

export async function postComment(cardId: string, comment: Partial<Comment>): Promise<Comment> {
  const r = await fetch(`${API}/api/cards/${cardId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comment),
  });
  return r.json();
}

export async function uploadEvidence(cardId: string, image: string, caption: string): Promise<{ url: string; caption: string }> {
  const r = await fetch(`${API}/api/cards/${cardId}/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, caption }),
  });
  return r.json();
}

export async function fetchMessages(ids?: string[]): Promise<ChatMessage[]> {
  const url = ids ? `${API}/api/messages?ids=${ids.join(',')}` : `${API}/api/messages/sync`;
  const r = await fetch(url);
  return r.json();
}

export async function fetchTriage(): Promise<TriageEntry[]> {
  const r = await fetch(`${API}/api/triage`);
  return r.json();
}

export async function postTriage(entry: Partial<TriageEntry>): Promise<void> {
  await fetch(`${API}/api/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}

export async function fetchAgents(): Promise<Agent[]> {
  const r = await fetch(`${API}/api/agents`);
  return r.json();
}

export async function fetchHistory(limit = 50): Promise<HistoryCommit[]> {
  const r = await fetch(`${API}/api/history?limit=${limit}`);
  return r.json();
}

export async function fetchSnapshot(hash: string): Promise<Board> {
  const r = await fetch(`${API}/api/history/snapshot?hash=${hash}`);
  return r.json();
}

export async function restoreSnapshot(hash: string): Promise<{ ok: boolean }> {
  const r = await fetch(`${API}/api/history/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hash }),
  });
  return r.json();
}

export async function fetchLogs(): Promise<LogEntry[]> {
  const r = await fetch(`${API}/api/logs`);
  return r.json();
}

export async function searchFiles(q: string): Promise<FileResult[]> {
  const r = await fetch(`${API}/api/files/search?q=${encodeURIComponent(q)}`);
  return r.json();
}

export async function generateCard(messageId: string, messageText: string, surroundingMessages: unknown[]): Promise<{ requestId: string }> {
  const r = await fetch(`${API}/api/cards/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, messageText, surroundingMessages }),
  });
  return r.json();
}

export async function pollGenerateCard(requestId: string): Promise<{ status: string; card?: Partial<Card> }> {
  const r = await fetch(`${API}/api/cards/generate/poll?id=${requestId}`);
  return r.json();
}
