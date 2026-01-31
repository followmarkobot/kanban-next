import React, { useState, useEffect } from 'react';
import { HistoryCommit, COL_ORDER, COL_TITLES, COL_COLORS } from '../lib/types';
import { getRelativeTime } from '../lib/utils';
import * as api from '../lib/api';

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onBoardRestored: () => void;
}

export default function HistoryPanel({ open, onClose, onBoardRestored }: HistoryPanelProps) {
  const [commits, setCommits] = useState<HistoryCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [snapshot, setSnapshot] = useState<{ hash: string; short: string; msg: string; board: any } | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(false);
    api.fetchHistory().then(c => { setCommits(c); setLoading(false); }).catch(() => { setError(true); setLoading(false); });
  }, [open]);

  const previewSnapshot = async (hash: string, short: string, msg: string) => {
    try {
      const board = await api.fetchSnapshot(hash);
      setSnapshot({ hash, short, msg, board });
    } catch { /* ignore */ }
  };

  const restoreFromSnapshot = async () => {
    if (!snapshot) return;
    if (!confirm('Restore the board to this version? Current state will be saved as a new version first.')) return;
    try {
      const result = await api.restoreSnapshot(snapshot.hash);
      if (result.ok) {
        setSnapshot(null);
        onClose();
        onBoardRestored();
      }
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className={`detail-overlay${open ? ' active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="detail-panel" style={{ maxWidth: '520px' }}>
          <div className="detail-header">
            <div className="detail-title">🕐 Version History</div>
            <div className="detail-desc">Every board change, tracked by Git. Click any version to preview or restore.</div>
          </div>
          <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '0.5rem 0' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
            ) : error ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--red)' }}>Failed to load history.</div>
            ) : commits.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No version history yet.</div>
            ) : (
              commits.map((c, i) => {
                const date = new Date(c.date);
                const relative = getRelativeTime(date);
                const fullDate = date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                const msg = c.message.replace(/^📋\s*/, '');
                return (
                  <div key={c.hash} className="history-item" onClick={() => previewSnapshot(c.hash, c.short, msg)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className="history-hash">{c.short}</span>
                      {i === 0 && <span style={{ fontSize: '0.58rem', padding: '0.05rem 0.3rem', borderRadius: '4px', background: 'var(--green-soft)', color: 'var(--green)', fontWeight: 600 }}>CURRENT</span>}
                      <span className="history-time" style={{ marginLeft: 'auto' }}>{relative} · {fullDate}</span>
                    </div>
                    <div className="history-msg">{msg}</div>
                    {c.changes && c.changes.length > 0 && (
                      <div className="history-changes">
                        {c.changes.slice(0, 4).map((ch, j) => {
                          const label = ch.type === 'moved' ? `${ch.card} → ${ch.to}` :
                            ch.type === 'added' ? `+ ${ch.card}` :
                            ch.type === 'removed' ? `− ${ch.card}` :
                            `✎ ${ch.card}`;
                          return <span key={j} className={`history-change change-${ch.type}`}>{label}</span>;
                        })}
                        {c.changes.length > 4 && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>+{c.changes.length - 4} more</span>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Snapshot preview */}
      {snapshot && (
        <div className="detail-overlay active" style={{ zIndex: 210 }} onClick={(e) => { if (e.target === e.currentTarget) setSnapshot(null); }}>
          <div className="detail-panel" style={{ maxWidth: '700px', maxHeight: '90vh' }}>
            <div className="detail-header">
              <div className="detail-title">Version {snapshot.short}</div>
              <div className="detail-desc">{snapshot.msg}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-accent" onClick={restoreFromSnapshot}>↩ Restore this version</button>
                <button className="btn" onClick={() => setSnapshot(null)}>Close</button>
              </div>
            </div>
            <div style={{ padding: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {COL_ORDER.map(colId => {
                  const cards = (snapshot.board.cards || []).filter((c: any) => c.column === colId);
                  return (
                    <div key={colId} style={{ minWidth: 200, maxWidth: 200, flexShrink: 0 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: COL_COLORS[colId], textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.4rem 0.5rem', marginBottom: '0.3rem', borderBottom: `2px solid ${COL_COLORS[colId]}33` }}>
                        {COL_TITLES[colId]} <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 400 }}>{cards.length}</span>
                      </div>
                      {cards.map((c: any) => {
                        const prioColor = c.priority === 'high' ? 'var(--red)' : c.priority === 'low' ? 'var(--green)' : 'var(--yellow)';
                        return (
                          <div key={c.id} style={{ padding: '0.4rem 0.5rem', marginBottom: '0.3rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', borderTop: `2px solid ${prioColor}` }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.3 }}>{c.title}</div>
                            {c.desc && <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.15rem', lineHeight: 1.4, maxHeight: '2.8em', overflow: 'hidden' }}>{c.desc}</div>}
                          </div>
                        );
                      })}
                      {cards.length === 0 && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0.5rem', textAlign: 'center' }}>Empty</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
                {(snapshot.board.cards || []).length} cards total
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
