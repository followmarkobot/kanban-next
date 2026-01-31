import React, { useState, useEffect, useRef } from 'react';

interface NewCardModalProps {
  open: boolean;
  defaultColumn?: string;
  prefill?: { title?: string; desc?: string; column?: string; priority?: string; assignee?: string; tags?: string; titleDisabled?: boolean; descDisabled?: boolean };
  sourceMessageId?: string | null;
  onClose: () => void;
  onAdd: (card: {
    title: string;
    desc: string;
    column: string;
    priority: string;
    assignee: string;
    tags: string[];
    link: string | null;
    sourceMessageId?: string | null;
  }) => void;
}

export default function NewCardModal({ open, defaultColumn, prefill, sourceMessageId, onClose, onAdd }: NewCardModalProps) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [column, setColumn] = useState('ideas');
  const [priority, setPriority] = useState('med');
  const [assignee, setAssignee] = useState('tobbot');
  const [link, setLink] = useState('');
  const [tags, setTags] = useState('');
  const [titleDisabled, setTitleDisabled] = useState(false);
  const [descDisabled, setDescDisabled] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (prefill) {
        setTitle(prefill.title || '');
        setDesc(prefill.desc || '');
        setColumn(prefill.column || defaultColumn || 'ideas');
        setPriority(prefill.priority || 'med');
        setAssignee(prefill.assignee || 'tobbot');
        setTags(prefill.tags || '');
        setTitleDisabled(!!prefill.titleDisabled);
        setDescDisabled(!!prefill.descDisabled);
      } else {
        setTitle('');
        setDesc('');
        setColumn(defaultColumn || 'ideas');
        setPriority('med');
        setAssignee('tobbot');
        setLink('');
        setTags('');
        setTitleDisabled(false);
        setDescDisabled(false);
      }
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open, defaultColumn, prefill]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      desc: desc.trim(),
      column,
      priority,
      assignee,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      link: link.trim() || null,
      sourceMessageId: sourceMessageId || null,
    });
    setTitle(''); setDesc(''); setLink(''); setTags('');
  };

  return (
    <div className={`modal-overlay${open ? ' active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2>New Card</h2>
        <label>Title</label>
        <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" disabled={titleDisabled} />
        <label>Description</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Details..." disabled={descDisabled} />
        <label>Column</label>
        <select value={column} onChange={e => setColumn(e.target.value)}>
          <option value="ideas">💡 Ideas</option>
          <option value="todo">📋 To Do</option>
          <option value="progress">🔨 In Progress</option>
          <option value="review">👀 Review</option>
          <option value="done">✅ Done</option>
        </select>
        <label>Priority</label>
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="med">Medium</option>
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
        <label>Assignee</label>
        <select value={assignee} onChange={e => setAssignee(e.target.value)}>
          <option value="tobbot">🤖 Tobbot</option>
          <option value="marko">M Marko</option>
          <option value="both">⚡ Both</option>
        </select>
        <label>Link (optional)</label>
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
        <label>Tags (comma separated)</label>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="frontend, ai, design" />
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={handleSubmit}>Add Card</button>
        </div>
      </div>
    </div>
  );
}
