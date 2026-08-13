import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, Building2, Pencil } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';

export const CreateWorkspaceModal: React.FC = () => {
  const navigate = useNavigate();
  const isOpen = useUIStore((s) => s.isAddWorkspaceOpen);
  const setIsOpen = useUIStore((s) => s.setIsAddWorkspaceOpen);
  const addWorkspace = useUIStore((s) => s.addWorkspace);
  const updateWorkspace = useUIStore((s) => s.updateWorkspace);
  const editing = useUIStore((s) => s.editingWorkspace);
  const setEditing = useUIStore((s) => s.setEditingWorkspace);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isEdit = editing !== null;

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [editing]);

  if (!isOpen && !editing) return null;

  const close = () => {
    setIsOpen(false);
    setEditing(null);
    setName('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (useAuthStore.getState().status !== 'authenticated') {
      close();
      toast.error('Sign up or log in to create a workspace');
      navigate('/login', { state: { from: '/workspaces' } });
      return;
    }

    try {
      if (isEdit && editing) {
        await updateWorkspace(editing.id, {
          name: name.trim(),
          description: description.trim() || '',
        });
      } else {
        await addWorkspace({
          name: name.trim(),
          description: description.trim() || 'Codebase architecture workspace',
        });
      }
      close();
    } catch {
      // Error is surfaced through the store's apiError banner.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-4)] bg-[var(--bg-overlay)] p-6 text-[var(--text-high)] shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-3)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              {isEdit ? <Pencil className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-strong)]">
                {isEdit ? 'Edit Workspace' : 'Create Workspace'}
              </h2>
              <p className="text-xs text-[var(--text-3)]">
                {isEdit ? 'Update workspace details' : 'Group related repositories and microservices'}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1 text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--text-2)] font-semibold mb-1">Workspace Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Platform Engineering Suite"
              className="w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[var(--text-2)] font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what codebases live in this workspace..."
              className="w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-[var(--border-4)] bg-[var(--bg-btn)] px-4 py-2 font-semibold text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--text-strong)] hover:bg-[var(--accent-hover)] shadow-lg shadow-indigo-600/30"
            >
              {isEdit ? 'Save Changes' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
