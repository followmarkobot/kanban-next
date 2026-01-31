import React, { useState } from 'react';
import { Card, COL_COLORS, COL_TITLES } from '../lib/types';
import { sortCards } from '../lib/utils';
import KanbanCard from './KanbanCard';

interface ColumnProps {
  colId: string;
  cards: Card[];
  onMoveCard: (id: string, column: string) => void;
  onDeleteCard: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onAddCard: (colId: string) => void;
  onDrop: (colId: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  defaultSort?: string;
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'priority', label: 'Priority ↑' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'alpha', label: 'A → Z' },
];

export default function Column({ colId, cards, onMoveCard, onDeleteCard, onOpenDetail, onAddCard, onDrop, onDragStart, onDragEnd, defaultSort }: ColumnProps) {
  const [sortType, setSortType] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('tobbot-col-sorts') || '{}');
        return saved[colId] || defaultSort || 'default';
      } catch { /* ignore */ }
    }
    return defaultSort || 'default';
  });
  const [dragOver, setDragOver] = useState(false);

  const sorted = sortCards(cards, colId, sortType);

  const handleSortChange = (val: string) => {
    setSortType(val);
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('tobbot-col-sorts') || '{}');
        saved[colId] = val;
        localStorage.setItem('tobbot-col-sorts', JSON.stringify(saved));
      } catch { /* ignore */ }
    }
  };

  return (
    <div className={`column${dragOver ? ' drag-over' : ''}`} data-status={colId}>
      <div className="column-header">
        <div className="column-title" style={{ color: COL_COLORS[colId] }}>
          {COL_TITLES[colId]} <span className="column-count">{cards.length}</span>
        </div>
        <select
          className="col-sort-select"
          value={sortType}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div
        className="card-list"
        data-column={colId}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => {
          if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDragOver(false);
        }}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(colId); }}
      >
        {sorted.map(c => (
          <KanbanCard
            key={c.id}
            card={c}
            colId={colId}
            onMoveCard={onMoveCard}
            onDeleteCard={onDeleteCard}
            onOpenDetail={onOpenDetail}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
      <div className="add-card" onClick={() => onAddCard(colId)}>+ Add card</div>
    </div>
  );
}
