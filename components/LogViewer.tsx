import React, { useState, useEffect } from 'react';
import { LogEntry } from '../lib/types';
import * as api from '../lib/api';

interface LogViewerProps {
  open: boolean;
  onClose: () => void;
}

export default function LogViewer({ open, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    api.fetchLogs().then(setLogs).catch(() => {});
  }, [open]);

  return (
    <div className={`detail-overlay${open ? ' active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="detail-panel" style={{ maxWidth: '620px' }}>
        <div className="detail-header">
          <div className="detail-title">📊 API Call Log</div>
          <div className="detail-desc">Every external API call Tobbot makes, logged automatically.</div>
        </div>
        <div style={{ padding: '0 1.5rem 1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No API calls logged yet.</div>
          ) : (
            logs.map((l, i) => {
              const time = l.timestamp ? new Date(l.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
              const statusIcon = l.success ? '✅' : '❌';
              const sizeStr = l.image_size_bytes ? `${(l.image_size_bytes / 1024 / 1024).toFixed(1)}MB` : '';
              const durationStr = l.duration_ms ? `${(l.duration_ms / 1000).toFixed(1)}s` : '';
              return (
                <div key={i} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{statusIcon}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>{l.provider}/{l.service}</span>
                      <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>{l.model}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {durationStr && <span>⏱ {durationStr}</span>}
                      {sizeStr && <span>💾 {sizeStr}</span>}
                      <span>{time}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5, padding: '0.4rem 0.6rem', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    {l.prompt || l.error || '(no prompt)'}
                  </div>
                  {l.output_file && (
                    <div style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', marginTop: '0.25rem' }}>→ {l.output_file}</div>
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
