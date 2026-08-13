import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, FolderGit2, Pencil } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { api } from '../../api/client';
import { UploadDropzone } from './UploadDropzone';

export const CreateProjectModal: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const isOpen = useUIStore((s) => s.isAddProjectOpen);
  const setIsOpen = useUIStore((s) => s.setIsAddProjectOpen);
  const addProject = useUIStore((s) => s.addProject);
  const updateProject = useUIStore((s) => s.updateProject);
  const editing = useUIStore((s) => s.editingProject);
  const setEditing = useUIStore((s) => s.setEditingProject);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setFiles([]);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEdit && editing) {
      try {
        await updateProject(editing.id, {
          name: name.trim(),
          description: description.trim() || '',
        });
        close();
      } catch {
        // Error is surfaced through the store's apiError banner.
      }
      return;
    }

    if (!workspaceId) return;
    const targetWsId = workspaceId;

    setIsSubmitting(true);
    try {
      const newProj = await addProject({
        workspaceId: targetWsId,
        name: name.trim(),
        description: description.trim() || 'Codebase architecture project',
      });

      for (const file of files) {
        try {
          await api.uploadChunked<{ uploadedFileCount: number }>(`/projects/${newProj.id}/upload`, file);
        } catch (err) {
          console.warn('[modal] Upload skipped:', (err as Error).message);
        }
      }

      if (files.length) {
        try {
          await api.post(`/projects/${newProj.id}/analyze`);
        } catch (err) {
          console.warn('[modal] Analysis could not be started:', (err as Error).message);
        }
      }

      close();
      // Navigate to new project workflow canvas
      navigate(`/workspaces/${targetWsId}/projects/${newProj.id}`);
    } catch {
      // Error is surfaced through the store's apiError banner; keep the modal open.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border-4)] bg-[var(--bg-overlay)] p-6 text-[var(--text-high)] shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-3)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              {isEdit ? <Pencil className="h-4 w-4" /> : <FolderGit2 className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-strong)]">
                {isEdit ? 'Edit Project' : 'Create & Analyze Codebase Project'}
              </h2>
              <p className="text-xs text-[var(--text-3)]">
                {isEdit ? 'Update project details' : 'Upload source code or connect a local directory'}
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
            <label className="block text-[var(--text-2)] font-semibold mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Identity Microservice"
              className="w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[var(--text-2)] font-semibold mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short overview of what this project does..."
              className="w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-[var(--text-2)] font-semibold mb-1">Codebase Drop Zone</label>
              <UploadDropzone onFilesSelected={setFiles} />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border-2)]">
            <button
              type="button"
              onClick={close}
              disabled={isSubmitting}
              className="rounded-lg border border-[var(--border-4)] bg-[var(--bg-btn)] px-4 py-2 font-semibold text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--text-strong)] hover:bg-[var(--accent-hover)] shadow-lg shadow-indigo-600/30 disabled:opacity-60"
            >
              {isSubmitting
                ? files.length
                  ? 'Uploading & Analyzing…'
                  : 'Creating…'
                : isEdit
                ? 'Save Changes'
                : 'Analyze & Generate Canvas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
