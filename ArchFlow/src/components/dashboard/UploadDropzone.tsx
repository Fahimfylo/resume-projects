import React, { useState } from 'react';
import { UploadCloud, FileArchive, CheckCircle2, X } from 'lucide-react';

interface Props {
  onFilesSelected?: (files: File[]) => void;
}

const isZip = (f: File) => f.name.toLowerCase().endsWith('.zip') || f.type.includes('zip');

export const UploadDropzone: React.FC<Props> = ({ onFilesSelected }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const commit = (files: File[]) => {
    const combined = Array.from(new Map([...uploadedFiles, ...files].map((f) => [f.name + f.size, f])).values());
    setUploadedFiles(combined);
    if (onFilesSelected) onFilesSelected(combined);
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      commit(Array.from<File>(e.target.files).filter(isZip));
      e.target.value = '';
    }
  };

  const removeFile = (file: File) => {
    const filtered = uploadedFiles.filter((f) => f.name !== file.name || f.size !== file.size);
    setUploadedFiles(filtered);
    if (onFilesSelected) onFilesSelected(filtered);
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          commit(Array.from<File>(e.dataTransfer.files).filter(isZip));
        }}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-6 text-center transition-all ${
          isDragging
            ? 'border-[var(--accent-border)] bg-[var(--accent-bg)]'
            : 'border-[var(--border-4)] bg-[var(--bg-raised)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-panel)]'
        }`}
      >
        <input
          type="file"
          multiple
          accept=".zip"
          onChange={handlePick}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        {uploadedFiles.length > 0 ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold">
                {uploadedFiles.length} archive{uploadedFiles.length > 1 ? 's' : ''} ready
              </span>
            </div>
            <div className="mt-2 flex max-w-full flex-wrap items-center justify-center gap-1.5">
              {uploadedFiles.map((file) => (
                <span
                  key={file.name + file.size}
                  className="flex max-w-full items-center gap-1.5 rounded-full border border-[var(--border-4)] bg-[var(--bg-panel)] px-2.5 py-1 text-[11px] font-mono text-[var(--text-2)]"
                >
                  <FileArchive className="h-3 w-3 shrink-0 text-[var(--accent-text)]" />
                  <span className="truncate">{file.name}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-semibold text-[var(--text-1)]">
              Click or drag & drop to add more archives
            </p>
          </div>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <UploadCloud className="h-5 w-5" />
            </div>

            <p className="mt-2 text-xs font-semibold text-[var(--text-1)]">
              Drag & drop a .zip codebase archive or click to browse
            </p>
            <p className="text-[11px] text-[var(--text-3)] mt-0.5">
              Zip your project folder, then upload it here — it will be extracted and parsed
            </p>
          </>
        )}
      </div>

      {/* Uploaded Archive List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-3)]">
            <span>Uploaded Archives ({uploadedFiles.length})</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Ready for AST Graph
            </span>
          </div>

          <div className="max-h-28 overflow-y-auto space-y-1 rounded-lg border border-[var(--border-1)] bg-[var(--bg-raised)] p-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.name + file.size}
                className="flex items-center justify-between rounded bg-[var(--bg-row)] px-2.5 py-1 text-xs font-mono text-[var(--text-2)]"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileArchive className="h-3.5 w-3.5 text-[var(--accent-text)] shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  className="p-0.5 text-[var(--text-4)] hover:text-rose-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
