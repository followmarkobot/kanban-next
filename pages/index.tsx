import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { Board as BoardType, Card, Comment } from '../lib/types';
import * as apiLib from '../lib/api';
import { useToast, useSyncStatus } from '../lib/context';
import Header from '../components/Header';
import BoardComponent from '../components/Board';
import NewCardModal from '../components/NewCardModal';
import CardDetailModal from '../components/CardDetailModal';
import ChatPanel from '../components/ChatPanel';
import AgentsPanel from '../components/AgentsPanel';
import HistoryPanel from '../components/HistoryPanel';
import LogViewer from '../components/LogViewer';
import ResourceDirectory from '../components/ResourceDirectory';

export default function Home() {
  const [board, setBoard] = useState<BoardType>({ columns: [], cards: [] });
  const [lastUpdated, setLastUpdated] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Panel states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultCol, setModalDefaultCol] = useState<string | undefined>();
  const [modalPrefill, setModalPrefill] = useState<any>(null);
  const [modalSourceMsgId, setModalSourceMsgId] = useState<string | null>(null);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const { showToast } = useToast();
  const { setSyncStatus } = useSyncStatus();

  const loadBoard = useCallback(async () => {
    try {
      const data = await apiLib.fetchBoard();
      setBoard(data);
      setSyncStatus('live');
      setLastUpdated(`Updated ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      console.error('Failed to load board:', e);
    }
  }, [setSyncStatus]);

  useEffect(() => {
    loadBoard();
    const interval = setInterval(loadBoard, 5000);
    return () => clearInterval(interval);
  }, [loadBoard]);

  const handleMoveCard = async (id: string, column: string) => {
    setSyncStatus('saving');
    await apiLib.moveCard(id, column);
    setBoard(prev => ({
      ...prev,
      cards: prev.cards.map(c => c.id === id ? { ...c, column } : c),
    }));
    setSyncStatus('live');
    showToast('Card moved!');
  };

  const handleDeleteCard = async (id: string) => {
    setSyncStatus('saving');
    await apiLib.deleteCard(id);
    setBoard(prev => ({
      ...prev,
      cards: prev.cards.filter(c => c.id !== id),
    }));
    setSyncStatus('live');
    showToast('Card removed');
  };

  const handleAddCard = async (cardData: {
    title: string; desc: string; column: string; priority: string; assignee: string;
    tags: string[]; link: string | null; sourceMessageId?: string | null;
  }) => {
    setSyncStatus('saving');
    const card: Partial<Card> = {
      title: cardData.title,
      desc: cardData.desc,
      column: cardData.column,
      priority: cardData.priority as Card['priority'],
      assignee: cardData.assignee as Card['assignee'],
      tags: cardData.tags,
      link: cardData.link || undefined,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sourceMessages: cardData.sourceMessageId ? [cardData.sourceMessageId] : undefined,
    };
    const created = await apiLib.addCard(card);
    setBoard(prev => ({ ...prev, cards: [...prev.cards, created] }));

    // Log triage if from chat
    if (cardData.sourceMessageId) {
      try {
        await apiLib.postTriage({
          messageId: cardData.sourceMessageId,
          action: 'created',
          cardId: created.id,
          cardTitle: created.title,
        });
      } catch (e) { console.error('Triage log failed:', e); }
    }

    setSyncStatus('live');
    showToast('Card added!');
    setModalOpen(false);
    setModalPrefill(null);
    setModalSourceMsgId(null);
  };

  const handleDrop = (colId: string) => {
    if (draggedId) {
      handleMoveCard(draggedId, colId);
      setDraggedId(null);
    }
  };

  const openNewCardModal = (colId?: string) => {
    setModalDefaultCol(colId);
    setModalPrefill(null);
    setModalSourceMsgId(null);
    setModalOpen(true);
  };

  const handleCommentAdded = (cardId: string, comment: Comment) => {
    setBoard(prev => ({
      ...prev,
      cards: prev.cards.map(c => c.id === cardId ? { ...c, comments: [...(c.comments || []), comment] } : c),
    }));
    showToast('Comment added!');
  };

  const handleEvidenceAdded = (cardId: string, evidence: { url: string; caption: string }) => {
    setBoard(prev => ({
      ...prev,
      cards: prev.cards.map(c => c.id === cardId ? { ...c, evidence: [...(c.evidence || []), evidence] } : c),
    }));
    showToast('Evidence added!');
  };

  const handleCreateCardFromChat = async (msgId: string, msgText: string) => {
    // Attempt AI generation
    setModalSourceMsgId(msgId);
    setModalPrefill({
      title: '🧠 Generating with AI...',
      desc: '⏳ Analyzing message context...',
      titleDisabled: true,
      descDisabled: true,
    });
    setModalOpen(true);

    try {
      const { requestId } = await apiLib.generateCard(msgId, msgText, []);
      let card: Partial<Card> | undefined;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const pollData = await apiLib.pollGenerateCard(requestId);
        if (pollData.status === 'done') {
          card = pollData.card;
          break;
        }
        setModalPrefill((prev: any) => ({
          ...prev,
          title: `🧠 Generating${'.'.repeat((i % 3) + 1)}`,
        }));
      }

      if (card) {
        setModalPrefill({
          title: card.title || '',
          desc: card.desc || msgText || '',
          column: card.column || 'ideas',
          priority: card.priority || 'med',
          assignee: card.assignee || 'both',
          tags: (card.tags || []).join(', '),
        });
      } else {
        setModalPrefill({
          title: '',
          desc: msgText || '',
        });
      }
    } catch {
      setModalPrefill({
        title: '',
        desc: msgText || '',
      });
    }
  };

  const detailCard = detailCardId ? board.cards.find(c => c.id === detailCardId) || null : null;

  return (
    <>
      <Head>
        <title>🤖 Tobbot × Marko — Project Board</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <ResourceDirectory cards={board.cards} onOpenDetail={setDetailCardId} />

      <Header
        lastUpdated={lastUpdated}
        onOpenChat={() => setChatOpen(true)}
        onOpenAgents={() => setAgentsOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenLog={() => setLogOpen(true)}
        onRefresh={loadBoard}
        onNewCard={() => openNewCardModal()}
      />

      <BoardComponent
        cards={board.cards}
        onMoveCard={handleMoveCard}
        onDeleteCard={handleDeleteCard}
        onOpenDetail={setDetailCardId}
        onAddCard={openNewCardModal}
        onDrop={handleDrop}
        onDragStart={setDraggedId}
        onDragEnd={() => setDraggedId(null)}
      />

      <NewCardModal
        open={modalOpen}
        defaultColumn={modalDefaultCol}
        prefill={modalPrefill}
        sourceMessageId={modalSourceMsgId}
        onClose={() => { setModalOpen(false); setModalPrefill(null); setModalSourceMsgId(null); }}
        onAdd={handleAddCard}
      />

      <CardDetailModal
        card={detailCard}
        open={!!detailCardId}
        onClose={() => setDetailCardId(null)}
        onCommentAdded={handleCommentAdded}
        onEvidenceAdded={handleEvidenceAdded}
      />

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onOpenDetail={(id) => { setChatOpen(false); setTimeout(() => setDetailCardId(id), 300); }}
        onCreateCardFromChat={handleCreateCardFromChat}
      />

      <AgentsPanel open={agentsOpen} onClose={() => setAgentsOpen(false)} />
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} onBoardRestored={loadBoard} />
      <LogViewer open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
