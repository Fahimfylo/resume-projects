import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { motion } from 'motion/react';
import { Plus, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { ContentPlatform } from '../../types';
import { FilterChip } from '../ui/FilterChip';

interface ContentLibraryProps {
  projectId: string;
}

export function ContentLibrary({ projectId }: ContentLibraryProps) {
  const { contentItems, addContentItem, deleteContentItem, addToast } = useApp();
  const [platformFilter, setPlatformFilter] = useState<'All' | ContentPlatform>('All');
  const [showForm, setShowForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState<ContentPlatform>('LinkedIn');
  const [newText, setNewText] = useState('');

  const filteredContent = contentItems.filter((c) => {
    if (c.projectId !== projectId) return false;
    if (platformFilter !== 'All' && c.platform !== platformFilter) return false;
    return true;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to Clipboard', 'The draft is ready to be pasted into your channel controls.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {(['All', 'Twitter', 'LinkedIn', 'Instagram', 'Email'] as const).map((p) => (
            <FilterChip key={p} label={p} active={platformFilter === p} onClick={() => setPlatformFilter(p)} />
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-xs tracking-[0.01em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px] gap-1">
          <Plus size={14} /> Draft Custom Post
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-5 rounded-xl max-w-lg border border-black/10 space-y-4 mb-4 shadow-lg">
          <h4 className="text-xs font-mono font-black uppercase text-neutral-500">NEW PROMOTIONAL COPY DRAFT</h4>
          <div className="space-y-3">
            <div className="flex gap-2">
              <select value={newPlatform} onChange={(e: any) => setNewPlatform(e.target.value)}
                className="bg-[#1A1A1A]/5 border border-black/10 rounded-lg p-2.5 text-xs outline-none cursor-pointer">
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter">Twitter (X)</option>
                <option value="Instagram">Instagram</option>
                <option value="Email">Email Newsletters</option>
              </select>
            </div>
            <textarea rows={4} placeholder="Enter post body text..." value={newText} onChange={(e) => setNewText(e.target.value)}
              className="w-full bg-[#1A1A1A]/5 border border-black/10 rounded-lg p-2.5 text-xs outline-none focus:border-black/30 resize-none font-sans leading-relaxed" />
          </div>
          <div className="flex justify-end gap-2 text-xs pt-1">
            <button onClick={() => setShowForm(false)} className="inline-flex items-center justify-center px-5 py-2 rounded-[9999px] bg-transparent text-[#111111] font-medium text-xs border border-[rgba(17,17,17,0.2)] cursor-pointer transition-all duration-200 hover:bg-[rgba(17,17,17,0.05)]">Cancel</button>
            <button onClick={() => { if (!newText.trim()) return; addContentItem(projectId, newPlatform, 'Manual Campaign Draft', newText); setNewText(''); setShowForm(false); }}
              className="inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-xs tracking-[0.01em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333]">Create Draft</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredContent.map((c) => (
          <div key={c.id} className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 rounded-2xl flex flex-col justify-between border border-black/5 hover:border-black/12 hover:shadow-md transition-all space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start border-b border-black/5 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono bg-black/5 text-neutral-800 font-bold px-2 py-0.5 rounded uppercase">{c.platform}</span>
                  <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase ml-2">— {c.contentType}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => copyToClipboard(c.text)} className="p-1 hover:bg-black/5 rounded text-neutral-400 hover:text-black transition-colors" title="Copy Draft text"><Copy size={12} /></button>
                  <button onClick={() => { addToast('AI Regeneration', 'Refining marketing draft tone to match brand voice...', 'info'); setTimeout(() => addToast('Draft Updated', 'AI Copilot generated an alternate variant successfully.', 'success'), 1200); }}
                    className="p-1 hover:bg-black/5 rounded text-neutral-400 hover:text-[#1A1A1A] transition-colors" title="Regenerate with AI"><RefreshCw size={11} /></button>
                  <button onClick={() => deleteContentItem(c.id)} className="p-1 hover:bg-[#B91C1C]/10 rounded text-neutral-400 hover:text-[#B91C1C] transition-colors" title="Delete Draft"><Trash2 size={12} /></button>
                </div>
              </div>
              <p className="text-xs text-neutral-600 font-sans leading-relaxed whitespace-pre-wrap font-medium">{c.text}</p>
            </div>
            <div className="pt-3 border-t border-black/5 flex justify-between items-center text-[10px] font-mono text-neutral-400">
              <span>{c.text.length} CHARACTERS</span>
              <button onClick={() => { copyToClipboard(c.text); addToast('Launch Initiated', 'Post queued to your organic scheduling tool.', 'success'); }}
                className="text-neutral-700 hover:text-black font-bold flex items-center gap-1 uppercase">Deploy now →</button>
            </div>
          </div>
        ))}
        {filteredContent.length === 0 && (
          <div className="col-span-1 md:col-span-2 border border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center p-12 text-center py-24">
            <h5 className="text-sm font-bold text-neutral-800">No content drafts found</h5>
            <p className="text-xs text-neutral-400 max-w-xs mt-1">Toggle filters above or click "Draft Custom Post" to generate your first copywriting asset.</p>
          </div>
        )}
      </div>
    </div>
  );
}
