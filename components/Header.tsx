import React from 'react';
import { useSyncStatus } from '../lib/context';

interface HeaderProps {
  lastUpdated: string;
  onOpenChat: () => void;
  onOpenAgents: () => void;
  onOpenHistory: () => void;
  onOpenLog: () => void;
  onRefresh: () => void;
  onNewCard: () => void;
}

export default function Header({ lastUpdated, onOpenChat, onOpenAgents, onOpenHistory, onOpenLog, onRefresh, onNewCard }: HeaderProps) {
  const { syncStatus } = useSyncStatus();

  return (
    <div className="header">
      <div className="header-left">
        <h1>🤖 <span>Tobbot</span> × Marko</h1>
        <div
          className={`sync-badge ${syncStatus}`}
          title="Board polls every 5s. Cards managed by 📋 Board Manager sub-agent. Chat reads session transcript live."
        >
          <div className="sync-dot"></div>
          <span>{syncStatus === 'live' ? 'Live' : 'Saving...'}</span>
        </div>
      </div>
      <div className="header-actions">
        <span className="last-updated">{lastUpdated}</span>
        <button className="btn" onClick={onOpenChat}>💬 Chat</button>
        <button className="btn" onClick={onOpenAgents}>🤖 Agents</button>
        <button className="btn" onClick={onOpenHistory}>🕐 History</button>
        <button className="btn" onClick={onOpenLog}>📊 API Log</button>
        <button className="btn" onClick={onRefresh}>↻ Refresh</button>
        <button className="btn btn-accent" onClick={onNewCard}>+ New Card</button>
      </div>
    </div>
  );
}
