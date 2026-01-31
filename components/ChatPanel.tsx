import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, TriageEntry } from '../lib/types';
import * as api from '../lib/api';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  onOpenDetail: (id: string) => void;
  onCreateCardFromChat: (msgId: string, msgText: string) => void;
}

export default function ChatPanel({ open, onClose, onOpenDetail, onCreateCardFromChat }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [triageMap, setTriageMap] = useState<Record<string, TriageEntry>>({});
  const [filter, setFilter] = useState<'all' | 'marko' | 'tobbot'>('all');
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  const loadMessages = useCallback(async () => {
    try {
      const [msgs, triageLogs] = await Promise.all([
        api.fetchMessages(),
        api.fetchTriage(),
      ]);
      setMessages(msgs);
      const tMap: Record<string, TriageEntry> = {};
      for (const t of triageLogs) tMap[t.messageId] = t;
      setTriageMap(tMap);

      if (msgs.length !== lastCountRef.current) {
        lastCountRef.current = msgs.length;
        setTimeout(() => {
          if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }, 50);
      }
    } catch (e) {
      console.error('Chat load error:', e);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [open, loadMessages]);

  const filtered = filter === 'all' ? messages : messages.filter(m => (m.author || '').toLowerCase() === filter);

  const handleTriageClick = (cardId: string) => {
    onClose();
    setTimeout(() => onOpenDetail(cardId), 300);
  };

  return (
    <div className={`chat-panel${open ? ' open' : ''}`}>
      <div className="chat-panel-header">
        <div>
          <h2>💬 Chat History <span className="chat-live-dot"></span></h2>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'default' }}
            title="Chat reads from the Clawdbot session transcript in real-time. Board triage badges are created by the 📋 Board Manager sub-agent.">
            <span style={{ color: 'var(--accent)' }}>⚡ Source:</span> Session transcript
            <span style={{ color: 'var(--border)' }}>·</span>
            <span style={{ color: 'var(--green)' }}>📋</span> Triage by Board Manager
          </div>
        </div>
        <button className="chat-panel-close" onClick={onClose}>×</button>
      </div>
      <div className="chat-filter-bar">
        {(['all', 'marko', 'tobbot'] as const).map(f => (
          <button
            key={f}
            className={`chat-filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'marko' ? '👤 Marko' : '🤖 Tobbot'}
          </button>
        ))}
      </div>
      <div className="chat-panel-body" ref={bodyRef}>
        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No messages yet.</div>
        ) : (
          filtered.map((m, idx) => {
            const date = m.timestamp ? new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const prevDate = idx > 0 && filtered[idx - 1].timestamp ? new Date(filtered[idx - 1].timestamp!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const showDateDivider = date && date !== prevDate;

            const author = (m.author || 'unknown').toLowerCase();
            const cls = author === 'marko' ? 'marko' : 'tobbot';
            const name = author === 'marko' ? '👤 Marko' : '🤖 Tobbot';
            const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

            let text = m.text || '';
            const displayText = text.length > 300 ? text.substring(0, 300) + '...' : text;

            // Triage badge
            let triageBadge = null;
            if (cls === 'marko' && m.messageId) {
              const triage = triageMap[m.messageId];
              if (triage) {
                if (triage.action === 'created') {
                  triageBadge = (
                    <div
                      style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'var(--green-soft)', color: 'var(--green)', border: '1px solid rgba(74,222,128,0.2)', cursor: triage.cardId ? 'pointer' : 'default', transition: 'filter 0.12s' }}
                      onClick={() => triage.cardId && handleTriageClick(triage.cardId)}
                      title="Triaged by 📋 Board Manager"
                    >
                      ✨ {triage.cardTitle || 'New card'}
                    </div>
                  );
                } else if (triage.action === 'updated') {
                  triageBadge = (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.6 }} title="Updated card via Board Manager">
                      <span onClick={() => triage.cardId && handleTriageClick(triage.cardId)} style={{ cursor: triage.cardId ? 'pointer' : 'default' }}>
                        → updated {triage.cardTitle || 'card'}
                      </span>
                    </div>
                  );
                } else {
                  triageBadge = (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.55rem', color: 'var(--text-muted)', opacity: 0.4 }} title={triage.reason || 'No card action needed'}>
                      · skipped
                    </div>
                  );
                }
              } else {
                triageBadge = (
                  <div style={{ marginTop: '0.3rem' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onClose(); onCreateCardFromChat(m.messageId, text); }}
                      style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: '5px', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s' }}
                      onMouseOver={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--accent)'; (e.target as HTMLElement).style.color = 'var(--accent)'; }}
                      onMouseOut={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--text-muted)'; }}
                    >
                      + Create card
                    </button>
                  </div>
                );
              }
            }

            // Quote from previous speaker
            let quoteHtml = null;
            if (idx > 0) {
              const prev = filtered[idx - 1];
              const prevAuthor = (prev.author || '').toLowerCase();
              const timeDiff = Math.abs(new Date(m.timestamp || 0).getTime() - new Date(prev.timestamp || 0).getTime());
              let streak = 0;
              for (let j = idx - 1; j >= 0; j--) {
                if ((filtered[j].author || '').toLowerCase() === prevAuthor) streak++;
                else break;
              }
              if (prevAuthor !== author && prev.text && (timeDiff > 120000 || streak >= 3)) {
                const quoteText = prev.text.length > 120 ? prev.text.substring(0, 120) + '...' : prev.text;
                const quoteName = prevAuthor === 'marko' ? '👤 Marko' : '🤖 Tobbot';
                const quoteColor = prevAuthor === 'marko' ? 'var(--pink)' : 'var(--accent)';
                quoteHtml = (
                  <div style={{ fontSize: '0.68rem', padding: '0.3rem 0.5rem', marginBottom: '0.35rem', borderLeft: `2px solid ${quoteColor}`, background: 'rgba(255,255,255,0.02)', borderRadius: '0 4px 4px 0', color: 'var(--text-muted)' }} title={`Replying to ${quoteName}`}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, color: quoteColor }}>{quoteName}</span><br />
                    {quoteText.replace(/\n/g, ' ')}
                  </div>
                );
              }
            }

            return (
              <React.Fragment key={m.messageId || idx}>
                {showDateDivider && <div className="chat-date-divider">{date}</div>}
                <div className={`chat-msg ${cls}`}>
                  {quoteHtml}
                  <div className="chat-msg-author">{name} <span className="chat-msg-id">#{m.messageId}</span></div>
                  <div dangerouslySetInnerHTML={{ __html: displayText.replace(/\n/g, '<br>') }} />
                  {triageBadge}
                  <div className="chat-msg-time">{time}</div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>
      <div className="chat-panel-footer">
        {filtered.length} messages{filter !== 'all' ? ` (${filtered.length} of ${messages.length})` : ''} · Live
      </div>
    </div>
  );
}
