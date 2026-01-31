import React from 'react';
import { Card, COL_ORDER } from '../lib/types';
import Column from './Column';

interface BoardProps {
  cards: Card[];
  onMoveCard: (id: string, column: string) => void;
  onDeleteCard: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onAddCard: (colId: string) => void;
  onDrop: (colId: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

const DEFAULT_SORTS: Record<string, string> = { done: 'newest' };

export default function Board({ cards, onMoveCard, onDeleteCard, onOpenDetail, onAddCard, onDrop, onDragStart, onDragEnd }: BoardProps) {
  return (
    <div className="board" id="board">
      {COL_ORDER.map(colId => (
        <Column
          key={colId}
          colId={colId}
          cards={cards.filter(c => c.column === colId)}
          onMoveCard={onMoveCard}
          onDeleteCard={onDeleteCard}
          onOpenDetail={onOpenDetail}
          onAddCard={onAddCard}
          onDrop={onDrop}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          defaultSort={DEFAULT_SORTS[colId]}
        />
      ))}
    </div>
  );
}
