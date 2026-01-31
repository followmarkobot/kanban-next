import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, ASSIGNEE_MAP, Comment, Attachment } from '../lib/types';
import { getExtIcon, getTagColor } from '../lib/utils';
import * as api from '../lib/api';

interface CardDetailModalProps {
  card: Card | null;
  open: boolean;
  onClose: () => void;
  onCommentAdded: (cardId: string, comment: Comment) => void;
  onEvidenceAdded: (cardId: string, evidence: { url: string; caption: string }) => void;
}

const KNOWN_TAGS = ['infra', 'frontend', 'ai', 'automation', 'design', 'product'];

export default function CardDetailModal({ card, open, onClose, onCommentAdded, onEvidenceAdded }: CardDetailModalProps) {
  const [commentText, setCommentText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sourceMessages, setSourceMessages] = useState<any[] | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [acMode, setAcMode] = useState<'file' | 'tag' | null>(null);
  const [acResults, setAcResults] = useState<Attachment[]>([]);
  const [acSelected, setAcSelected] = useState(0);
  const [acStartPos, setAcStartPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && card?.sourceMessages?.length) {
      setSourceLoading(true);
      setSourceMessages(null);
      api.fetchMessages(card.sourceMessages).then(msgs => {
        setSourceMessages(msgs);
        setSourceLoading(false);
      }).catch(() => setSourceLoading(false));
    } else {
      setSourceMessages(null);
    }
  }, [open, card?.id]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [card?.comments?.length]);

  const closeAc = () => { setAcMode(null); setAcResults([]); };

  const handleInput = async (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const val = input.value;
    const pos = input.selectionStart || 0;

    let triggerChar: string | null = null;
    let triggerPos = -1;
    for (let i = pos - 1; i >= 0; i--) {
      if (val[i] === ' ' || val[i] === '\n') break;
      if (val[i] === '@') { triggerChar = '@'; triggerPos = i; break; }
      if (val[i] === '#') { triggerChar = '#'; triggerPos = i; break; }
    }

    if (triggerChar && triggerPos >= 0) {
      const q = val.substring(triggerPos + 1, pos).toLowerCase();
      setAcStartPos(triggerPos);
      if (triggerChar === '@') {
        setAcMode('file');
        try {
          const files = await api.searchFiles(q);
          setAcResults(files.map(f => ({ type: 'file' as const, name: f.name, path: f.path, url: f.servable, ext: f.ext, rel: f.rel })));
          setAcSelected(0);
        } catch { closeAc(); }
      } else {
        setAcMode('tag');
        setAcResults(KNOWN_TAGS.filter(t => !q || t.includes(q)).map(t => ({ type: 'tag' as const, name: t })));
        setAcSelected(0);
      }
    } else {
      closeAc();
    }
  };

  const selectAcItem = (item: Attachment) => {
    const input = inputRef.current;
    if (!input) return;
    const val = input.value;
    const before = val.substring(0, acStartPos);
    const after = val.substring(input.selectionStart || 0);
    setCommentText(before + after);
    if (!attachments.find(a => a.type === item.type && a.name === item.name)) {
      setAttachments([...attachments, item]);
    }
    closeAc();
    setTimeout(() => input.focus(), 0);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (acMode && acResults.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAcSelected(Math.min(acSelected + 1, acResults.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setAcSelected(Math.max(acSelected - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); if (acResults[acSelected]) selectAcItem(acResults[acSelected]); return; }
      if (e.key === 'Escape') { closeAc(); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); }
  };

  const postComment = async () => {
    if ((!commentText.trim() && !attachments.length) || !card) return;
    const comment: Partial<Comment> = {
      author: 'marko',
      text: commentText.trim(),
      attachments: attachments.length ? attachments.map(a => ({ type: a.type, name: a.name, path: a.path || undefined, url: a.url || undefined })) : undefined,
    };
    const saved = await api.postComment(card.id, comment);
    onCommentAdded(card.id, saved);
    setCommentText('');
    setAttachments([]);
    closeAc();
  };

  const handleEvidenceUpload = async (file: File) => {
    if (!file || !card) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const caption = prompt('Caption (optional):') || '';
      try {
        const evidence = await api.uploadEvidence(card.id, reader.result as string, caption);
        onEvidenceAdded(card.id, evidence);
      } catch (e) {
        console.error('Upload failed:', e);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!card) return null;

  const a = ASSIGNEE_MAP[card.assignee || 'both'] || ASSIGNEE_MAP.both;
  const comments = card.comments || [];
  const evidence = card.evidence || [];

  const renderAttachmentChip = (att: { type: string; name: string; url?: string; ext?: string }, idx?: number) => {
    if (att.type === 'file') {
      const icon = getExtIcon(att.ext || ('.' + att.name.split('.').pop()));
      const link = att.url ? <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name}</a> : att.name;
      return <span key={idx} className="comment-chip">{icon} {link}</span>;
    } else {
      const clr = getTagColor(att.name);
      return <span key={idx} className="comment-chip tag-chip" style={{ background: `${clr}18`, color: clr, borderColor: `${clr}33` }}>#{att.name}</span>;
    }
  };

  const formatSourceText = (text: string) => {
    const segments = text.split(/\s+-\s+/).map(s => s.trim()).filter(Boolean);
    if (segments.length > 2) {
      return (
        <ul style={{ margin: '0.3rem 0 0 1rem', padding: 0, listStyle: 'disc' }}>
          {segments.map((s, i) => <li key={i} style={{ marginBottom: '0.25rem', paddingLeft: '0.2rem' }}>{s}</li>)}
        </ul>
      );
    }
    return <span dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br>') }} />;
  };

  return (
    <div className={`detail-overlay${open ? ' active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="detail-panel">
        <div className="detail-header">
          <div className="detail-title">{card.title}</div>
          <div className="detail-desc">{card.desc || ''}</div>
          <div className="detail-meta">
            {(card.tags || []).map(t => <span key={t} className={`tag tag-${t}`}>{t}</span>)}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              {a.icon} {a.name} · {card.date || ''}
            </span>
            {card.link && (
              <a href={card.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', marginLeft: '0.5rem' }}>🔗 Open</a>
            )}
          </div>
        </div>

        {/* Source Messages */}
        {card.sourceMessages && card.sourceMessages.length > 0 && (
          <div style={{ padding: '0.75rem 1.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              💬 Source Messages
            </div>
            {sourceLoading ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.5rem' }}>Loading messages...</div>
            ) : sourceMessages && sourceMessages.length > 0 ? (
              sourceMessages.map((m: any, i: number) => {
                const time = m.timestamp ? new Date(m.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
                const authorCls = (m.author || '').toLowerCase() === 'marko' ? 'marko' : 'tobbot';
                return (
                  <div key={i} style={{ padding: '0.5rem 0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }} className={`comment-author ${authorCls}`}>{m.author}</span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{time}</span>
                      <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>msg#{m.messageId}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.65 }}>{formatSourceText(m.text)}</div>
                  </div>
                );
              })
            ) : sourceMessages && sourceMessages.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Messages not found in log</span>
            ) : null}
          </div>
        )}

        {/* Origin (paraphrased) fallback */}
        {!card.sourceMessages?.length && card.origin && (
          <div style={{ padding: '0.75rem 1.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              {card.origin.startsWith('⚠️') ? '⚠️ Paraphrased Context' : '💬 Source Context'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.6, padding: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {card.origin}
            </div>
          </div>
        )}

        {/* Files */}
        {card.files && card.files.length > 0 && (
          <div style={{ padding: '0 1.5rem 0.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>📁 Files</div>
            {card.files.map(f => (
              <div key={f} style={{ fontSize: '0.78rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', padding: '0.3rem 0' }}>📄 {f}</div>
            ))}
          </div>
        )}

        {/* Evidence */}
        <div style={{ padding: '0 1.5rem 0.5rem' }}>
          {evidence.length > 0 && (
            <>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>📸 Evidence</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {evidence.map((e, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <a href={e.url} target="_blank" rel="noopener noreferrer">
                      <img src={e.url} style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }} alt={e.caption || 'evidence'} />
                    </a>
                    {e.caption && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.caption}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', cursor: 'pointer', fontSize: '0.72rem', color: evidence.length ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 500 }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) handleEvidenceUpload(e.target.files[0]); }} />
            {evidence.length ? '+ Add screenshot' : '📸 Add evidence screenshot'}
          </label>
        </div>

        {/* Comments */}
        <div className="detail-section-title">💬 Comments</div>
        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="no-comments">No comments yet. Start the conversation!</div>
          ) : (
            comments.map((c, i) => {
              const time = c.timestamp ? new Date(c.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
              return (
                <div key={i} className="comment">
                  <div className="comment-header">
                    <span className={`comment-author ${c.author || 'marko'}`}>
                      {c.author === 'tobbot' ? '🤖 Tobbot' : '👤 Marko'}
                    </span>
                    <span className="comment-time">{time}</span>
                  </div>
                  <div className="comment-text">{c.text}</div>
                  {c.attachments && c.attachments.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                      {c.attachments.map((a, j) => renderAttachmentChip(a, j))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment input */}
        <div className="comment-input-wrap">
          {acMode && acResults.length > 0 && (
            <div className="ac-dropdown active">
              <div className="ac-header">{acMode === 'file' ? '📁 Files' : '🏷️ Tags'}</div>
              {acResults.map((item, i) => (
                <div key={i} className={`ac-item${i === acSelected ? ' selected' : ''}`} onClick={() => selectAcItem(item)}>
                  {item.type === 'file' ? (
                    <>
                      <span className="ac-item-icon">{getExtIcon(item.ext || '')}</span>
                      <span className="ac-item-name">{item.name}</span>
                      <span className="ac-item-path">{item.rel}</span>
                    </>
                  ) : (
                    <>
                      <span className="ac-item-icon" style={{ color: getTagColor(item.name) }}>●</span>
                      <span className="ac-item-name">{item.name}</span>
                    </>
                  )}
                </div>
              ))}
              <div className="ac-hint">↑↓ navigate · Enter select · Esc close</div>
            </div>
          )}
          <div className="comment-attachments">
            {attachments.map((a, i) => (
              <span key={i} className={`comment-chip${a.type === 'tag' ? ' tag-chip' : ''}`}
                style={a.type === 'tag' ? { background: `${getTagColor(a.name)}18`, color: getTagColor(a.name), borderColor: `${getTagColor(a.name)}33` } : {}}>
                {a.type === 'file' ? `${getExtIcon(a.ext || '')} ` : '#'}{a.name}
                <span className="chip-remove" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}>×</span>
              </span>
            ))}
          </div>
          <div className="comment-input-row">
            <input
              ref={inputRef}
              className="comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onInput={handleInput}
              onKeyDown={handleKey}
              placeholder="Type @ for files, # for tags..."
            />
            <button className="btn btn-accent" onClick={postComment} style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
