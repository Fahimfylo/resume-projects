import React, { useState } from 'react';
import { X, Plus, Sparkles, FileCode } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { NodeCategory } from '../../types';

export const AddNodeModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.isAddNodeModalOpen);
  const setIsOpen = useUIStore((s) => s.setIsAddNodeModalOpen);
  const addNode = useCanvasStore((s) => s.addNode);

  const [label, setLabel] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<NodeCategory>('component');
  const [filePath, setFilePath] = useState('');
  const [summary, setSummary] = useState('');

  if (!isOpen) return null;

  const categories: { id: NodeCategory; label: string }[] = [
    { id: 'page', label: 'Page View' },
    { id: 'component', label: 'React Component' },
    { id: 'route', label: 'API Route' },
    { id: 'controller', label: 'Controller' },
    { id: 'service', label: 'Service' },
    { id: 'model', label: 'ORM Model' },
    { id: 'external-api', label: 'External API' },
    { id: 'db-table', label: 'DB Table' },
    { id: 'hook', label: 'React Hook' },
    { id: 'store', label: 'State Store' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    addNode({
      label: label.trim(),
      subtitle: subtitle.trim() || 'Custom Code Node',
      category,
      filePath: filePath.trim() || `src/custom/${label.trim().toLowerCase()}.ts`,
      summary: summary.trim() || 'Manually annotated codebase entity.',
    });

    setLabel('');
    setSubtitle('');
    setFilePath('');
    setSummary('');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-4)] bg-[var(--bg-overlay)] p-6 text-[var(--text-high)] shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-3)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-strong)]">Add Architecture Node</h2>
              <p className="text-xs text-[var(--text-3)]">Annotate or drop a custom entity onto canvas</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--text-2)] font-semibold mb-1">Entity Name *</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. PaymentWebhookListener"
              className="w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-2)] font-semibold mb-1">Kind / Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NodeCategory)}
                className="w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 text-[var(--text-high)] focus:border-[var(--accent-hover)] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-2)] font-semibold mb-1">Subtitle / Role</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Stripe Webhook Receiver"
                className="w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-2)] font-semibold mb-1">File Path</label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="e.g. server/routes/stripeWebhook.ts"
              className="w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 font-mono text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[var(--text-2)] font-semibold mb-1">Architecture Summary</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of what this component or service does..."
              className="w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-[var(--border-4)] bg-[var(--bg-btn)] px-4 py-2 font-semibold text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--text-strong)] hover:bg-[var(--accent-hover)] shadow-lg shadow-indigo-600/30"
            >
              Add to Diagram
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
