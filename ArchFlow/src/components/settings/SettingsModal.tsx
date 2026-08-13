import React from 'react';
import { X, Palette, Check } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useThemeStore, THEMES, ThemeId } from '../../store/useThemeStore';
import { useCanvasStore } from '../../store/useCanvasStore';

export const SettingsModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.isSettingsOpen);
  const setIsOpen = useUIStore((s) => s.setIsSettingsOpen);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const accordionMode = useCanvasStore((s) => s.accordionMode);
  const setAccordionMode = useCanvasStore((s) => s.setAccordionMode);

  if (!isOpen) return null;

  const select = (id: ThemeId) => setTheme(id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border-4)] bg-[var(--bg-overlay)] p-6 text-[var(--text-1)] shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-strong)]">Settings</h2>
              <p className="text-xs text-[var(--text-3)]">Appearance & preferences</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-2)] mb-2">Theme</label>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => select(t.id)}
                  className={`group relative rounded-xl border p-3 text-left transition-all ${
                    active
                      ? 'border-[var(--accent)] ring-2 ring-[var(--accent-border)]'
                      : 'border-[var(--border-3)] hover:border-[var(--accent-border)]'
                  }`}
                  style={{ background: t.preview.surface }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: t.preview.text }}>
                      {t.name}
                    </span>
                    {active && (
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ background: t.preview.accent }}
                      >
                        <Check className="h-3 w-3 text-[var(--text-strong)]" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug" style={{ color: t.preview.text, opacity: 0.75 }}>
                    {t.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span
                      className="h-5 w-8 rounded-md border border-[var(--border-2)]"
                      style={{ background: t.preview.app }}
                    />
                    <span
                      className="h-5 w-5 rounded-md"
                      style={{ background: t.preview.accent }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-raised)] p-3 text-xs text-[var(--text-3)]">
          Your theme preference is saved locally and applies to the whole app.
        </div>

        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-raised)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--text-1)]">Accordion mode</div>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-3)]">
                Opening a container auto-collapses its open siblings so the canvas stays scoped to one branch per level.
              </p>
            </div>
            <button
              onClick={() => setAccordionMode(!accordionMode)}
              role="switch"
              aria-checked={accordionMode}
              className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                accordionMode ? 'border-[var(--accent-border)] bg-[var(--accent)]' : 'border-[var(--border-3)] bg-[var(--bg-inset)]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-[var(--text-strong)] shadow transition-all ${
                  accordionMode ? 'left-[22px]' : 'left-0.5'
                }`}
                style={{ width: 18, height: 18 }}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg border border-[var(--border-3)] bg-[var(--bg-btn)] px-4 py-2 font-semibold text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
