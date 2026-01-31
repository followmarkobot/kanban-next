import React from 'react';
import { Card, ASSIGNEE_MAP, COL_ORDER } from '../lib/types';

interface KanbanCardProps {
  card: Card;
  colId: string;
  onMoveCard: (id: string, column: string) => void;
  onDeleteCard: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

export default function KanbanCard({ card, colId, onMoveCard, onDeleteCard, onOpenDetail, onDragStart, onDragEnd }: KanbanCardProps) {
  const idx = COL_ORDER.indexOf(colId as typeof COL_ORDER[number]);
  const a = ASSIGNEE_MAP[card.assignee || 'both'] || ASSIGNEE_MAP.both;
  const commentCount = (card.comments || []).length;
  const evidenceCount = (card.evidence || []).length;
  const isLocal = card.link && card.link.includes('localhost');

  return (
    <div
      className="card"
      draggable
      data-id={card.id}
      onClick={() => onOpenDetail(card.id)}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', card.id);
        onDragStart(card.id);
        (e.currentTarget as HTMLElement).classList.add('dragging');
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).classList.remove('dragging');
        onDragEnd();
      }}
    >
      <div className={`card-priority priority-${card.priority || 'med'}`}></div>
      <div className="card-actions">
        {idx > 0 && (
          <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); onMoveCard(card.id, COL_ORDER[idx - 1]); }}>←</button>
        )}
        {idx < COL_ORDER.length - 1 && (
          <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); onMoveCard(card.id, COL_ORDER[idx + 1]); }}>→</button>
        )}
        <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}>×</button>
      </div>
      <div className="card-title">{card.title}</div>
      {card.desc && <div className="card-desc">{card.desc}</div>}
      {card.tags && card.tags.length > 0 && (
        <div className="card-tags">
          {card.tags.map(t => <span key={t} className={`tag tag-${t}`}>{t}</span>)}
        </div>
      )}
      {card.link && (
        <div className="card-link-wrap" onClick={(e) => e.stopPropagation()}>
          <a className="card-link" href={card.link} target="_blank" rel="noopener noreferrer">🔗 Open resource</a>
          {isLocal ? (
            <div className="link-preview">
              <iframe src={card.link} loading="lazy" sandbox="allow-same-origin" title="preview"></iframe>
              <div className="link-preview-url">{card.link}</div>
            </div>
          ) : (
            <div className="link-preview" style={{ display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              <div className="link-preview-url">{card.link}</div>
            </div>
          )}
        </div>
      )}
      {card.files && card.files.length > 0 && (
        <div className="card-files">
          {card.files.map(f => <span key={f} className="card-file">📄 {f.split('/').pop()}</span>)}
        </div>
      )}
      <div className="card-footer">
        <div className="card-assignee">
          <div className={`assignee-dot ${a.cls}`}>{a.icon}</div>
          {a.name}
        </div>
        <span className="card-date">{card.date || ''}</span>
        {(evidenceCount > 0 || commentCount > 0) && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
            {evidenceCount > 0 && `📸 ${evidenceCount}`}
            {commentCount > 0 && `💬 ${commentCount}`}
          </span>
        )}
      </div>
    </div>
  );
}
