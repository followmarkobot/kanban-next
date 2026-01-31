import React, { useState, useEffect } from 'react';
import { Agent } from '../lib/types';
import * as api from '../lib/api';

interface AgentsPanelProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, string> = { persistent: '🔄', 'on-demand': '⚡', 'one-shot': '🎯', cron: '⏰' };
const TYPE_LABELS: Record<string, string> = { persistent: 'Always On', 'on-demand': 'On Demand', 'one-shot': 'One-Shot', cron: 'Scheduled' };

export default function AgentsPanel({ open, onClose }: AgentsPanelProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(false);
    api.fetchAgents().then(setAgents).catch(() => setError(true));
  }, [open]);

  return (
    <div className={`detail-overlay${open ? ' active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="detail-panel" style={{ maxWidth: '560px' }}>
        <div className="detail-header">
          <div className="detail-title">🤖 Agent Directory</div>
          <div className="detail-desc">Sub-agents and automated workers running in the background.</div>
        </div>
        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--red)' }}>Failed to load agents.</div>
          ) : agents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No agents registered yet.</div>
          ) : (
            agents.map((a, i) => {
              const lastActive = a.lastActive ? new Date(a.lastActive).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Unknown';
              return (
                <div key={i} className="agent-card">
                  <div className="agent-header">
                    <div className="agent-emoji">{a.emoji}</div>
                    <div className="agent-info">
                      <div className="agent-name">{a.name}</div>
                      <div className="agent-role">{a.role}</div>
                    </div>
                    <span className={`agent-status ${a.status}`}>{a.status}</span>
                  </div>
                  <div className="agent-desc">{a.desc}</div>
                  <div className="agent-meta">
                    <span className="agent-meta-item">{TYPE_ICONS[a.type] || '🔧'} {TYPE_LABELS[a.type] || a.type}</span>
                    {a.schedule && <span className="agent-meta-item">📅 {a.schedule}</span>}
                    {a.trigger && <span className="agent-meta-item">⚡ {a.trigger}</span>}
                    <span className="agent-meta-item">🕐 {lastActive}</span>
                  </div>
                  {a.stats && (
                    <div className="agent-stats">
                      {Object.entries(a.stats).map(([k, v]) => (
                        <span key={k} className="agent-stat">
                          <span className="agent-stat-value">{v}</span> {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
