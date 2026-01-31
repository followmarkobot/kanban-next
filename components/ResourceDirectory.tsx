import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../lib/types';
import { getFileIcon } from '../lib/utils';
import * as api from '../lib/api';
import { FileResult } from '../lib/types';

interface ResourceDirectoryProps {
  cards: Card[];
  onOpenDetail: (id: string) => void;
}

const COL_WEIGHT: Record<string, number> = { progress: 0, review: 1, todo: 2, ideas: 3, done: 4 };
const PRIORITY_WEIGHT: Record<string, number> = { high: 0, med: 1, low: 2 };
const COL_NAMES: Record<string, string> = { ideas: 'Ideas', todo: 'To Do', progress: 'In Progress', review: 'Review', done: 'Done' };
const STATUS_COLORS: Record<string, string> = { ideas: 'var(--yellow)', todo: 'var(--blue)', progress: 'var(--accent)', review: 'var(--orange)', done: 'var(--green)' };

export default function ResourceDirectory({ cards, onOpenDetail }: ResourceDirectoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['completed']));
  const [wsFiles, setWsFiles] = useState<FileResult[]>([]);
  const fileCacheRef = useRef<{ files: FileResult[]; time: number }>({ files: [], time: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFiles = useCallback(async (q: string) => {
    const now = Date.now();
    if (!q && fileCacheRef.current.files.length && now - fileCacheRef.current.time < 10000) {
      setWsFiles(fileCacheRef.current.files);
      return;
    }
    try {
      const files = await api.searchFiles(q);
      if (!q) { fileCacheRef.current = { files, time: now }; }
      setWsFiles(files);
    } catch { setWsFiles([]); }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchFiles(query), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [isOpen, query, fetchFiles]);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    document.body.classList.toggle('dir-open', next);
  };

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Filter & sort projects
  let projects = cards
    .filter(c => c.link || (c.files && c.files.length))
    .sort((a, b) => {
      const cw = (COL_WEIGHT[a.column] ?? 5) - (COL_WEIGHT[b.column] ?? 5);
      if (cw !== 0) return cw;
      return (PRIORITY_WEIGHT[a.priority || 'med'] ?? 1) - (PRIORITY_WEIGHT[b.priority || 'med'] ?? 1);
    });

  if (query) {
    const q = query.toLowerCase();
    projects = projects.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.link || '').toLowerCase().includes(q) ||
      (c.files || []).some(f => f.toLowerCase().includes(q)) ||
      (c.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  // Card file paths to avoid dupes
  const cardFilePaths = new Set<string>();
  cards.forEach(c => c.files?.forEach(f => cardFilePaths.add(f)));

  const extraFiles = wsFiles.filter(f =>
    !cardFilePaths.has(f.path) && !f.name.startsWith('.') && !['package-lock.json', 'node_modules'].includes(f.name)
  );

  // Group ws files by dir
  const fileDirs: Record<string, FileResult[]> = {};
  for (const f of extraFiles) {
    const parts = f.rel.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
    if (!fileDirs[dir]) fileDirs[dir] = [];
    fileDirs[dir].push(f);
  }

  const active = projects.filter(c => c.column !== 'done');
  const completed = projects.filter(c => c.column === 'done');

  const renderCardGroup = (label: string, groupCards: Card[], key: string) => {
    if (groupCards.length === 0) return null;
    const collapsed = collapsedSections.has(key);
    return (
      <div className="dir-section">
        <div className={`dir-section-header${collapsed ? ' collapsed' : ''}`} onClick={() => toggleSection(key)}>
          <span className="chevron">▼</span> {label}
          <span className="dir-section-count">{groupCards.length}</span>
        </div>
        <div className={`dir-section-items${collapsed ? ' collapsed' : ''}`} style={{ maxHeight: collapsed ? 0 : groupCards.length * 120 }}>
          {groupCards.map(c => {
            const color = STATUS_COLORS[c.column] || 'var(--text-muted)';
            const colLabel = COL_NAMES[c.column] || c.column;
            const resources: { icon: string; name: string; url?: string; path?: string }[] = [];
            if (c.link) {
              resources.push({ icon: c.link.includes('localhost') ? '🌐' : '🔗', name: c.link.replace(/^https?:\/\//, '').replace(/\/$/, ''), url: c.link });
            }
            if (c.files) {
              for (const f of c.files) {
                const fname = f.split('/').pop() || f;
                resources.push({ icon: getFileIcon(fname), name: fname, url: f.startsWith('~/clawd/') ? `/files/${f.replace('~/clawd/', '')}` : undefined, path: f });
              }
            }
            return (
              <div key={c.id} onClick={() => onOpenDetail(c.id)}
                style={{ padding: '0.6rem 1.25rem', cursor: 'pointer', transition: 'background 0.12s', borderBottom: '1px solid var(--border)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                  <span className="dir-item-tag" style={{ background: `${color}22`, color, fontSize: '0.58rem', padding: '0.08rem 0.35rem', borderRadius: '4px', flexShrink: 0 }}>{colLabel}</span>
                </div>
                {resources.map((r, i) => r.url ? (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.15rem 0', textDecoration: 'none', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                    <span style={{ fontSize: '0.68rem' }}>{r.icon}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  </a>
                ) : (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.15rem 0', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    <span style={{ fontSize: '0.68rem' }}>{r.icon}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.path || r.name}>{r.name}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const totalProjects = active.length + completed.length;
  const fileParts: string[] = [];
  if (totalProjects) fileParts.push(`${totalProjects} project${totalProjects !== 1 ? 's' : ''}`);
  if (extraFiles.length) fileParts.push(`${extraFiles.length} file${extraFiles.length !== 1 ? 's' : ''}`);

  return (
    <>
      <div className={`directory-sidebar${isOpen ? ' open' : ''}`}>
        <div className="directory-header">
          <h2>📂 Resource Directory</h2>
          <div className="subtitle">All artifacts & links across cards</div>
          <input className="directory-search" placeholder="Search resources..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="directory-body">
          {projects.length === 0 && extraFiles.length === 0 ? (
            <div className="dir-empty">{query ? 'No matches' : 'No resources yet'}</div>
          ) : (
            <>
              {renderCardGroup('🔥 Active', active, 'active')}
              {renderCardGroup('✅ Completed', completed, 'completed')}
              {Object.keys(fileDirs).length > 0 && (
                <div className="dir-section">
                  <div className={`dir-section-header${collapsedSections.has('files') ? ' collapsed' : ''}`} onClick={() => toggleSection('files')}>
                    <span className="chevron">▼</span> 📁 Workspace Files
                    <span className="dir-section-count">{extraFiles.length}</span>
                  </div>
                  <div className={`dir-section-items${collapsedSections.has('files') ? ' collapsed' : ''}`} style={{ maxHeight: collapsedSections.has('files') ? 0 : extraFiles.length * 40 + Object.keys(fileDirs).length * 30 }}>
                    {Object.keys(fileDirs).sort().map(dir => (
                      <React.Fragment key={dir}>
                        <div style={{ padding: '0.35rem 1.25rem 0.15rem', fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'JetBrains Mono', monospace" }}>
                          {dir === '.' ? 'root' : dir}/
                        </div>
                        {fileDirs[dir].map(f => {
                          const icon = getFileIcon(f.name);
                          return f.servable ? (
                            <a key={f.path} href={f.servable} target="_blank" rel="noopener noreferrer" className="dir-item" onClick={(e) => e.stopPropagation()}>
                              <span className="dir-item-icon">{icon}</span>
                              <div className="dir-item-info">
                                <div className="dir-item-name">{f.name}</div>
                                <div className="dir-item-meta">{f.rel}</div>
                              </div>
                            </a>
                          ) : (
                            <div key={f.path} className="dir-item">
                              <span className="dir-item-icon">{icon}</span>
                              <div className="dir-item-info">
                                <div className="dir-item-name">{f.name}</div>
                                <div className="dir-item-meta">{f.path}</div>
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="dir-footer">{fileParts.join(' · ')}</div>
      </div>
      <div className={`directory-toggle${isOpen ? ' open' : ''}`} onClick={toggle}>
        <span>📂 INDEX</span>
      </div>
    </>
  );
}
