import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: 'How long does analysis take for a large codebase?',
    a: 'A typical mid-size repo analyzes in under five minutes. Parsing is deterministic and runs in parallel across files; AI summaries stream in after the structural map is built, so you can start exploring almost immediately.',
  },
  {
    q: 'Which languages and frameworks are supported today?',
    a: 'Today we parse TypeScript, JavaScript, JSX/TSX (React), ESM, and CommonJS — covering the common React/Node/Express stack, plus JSON config and HTML entry points. Other languages are on the roadmap.',
  },
  {
    q: 'Does ArchFlow send my code to a third party?',
    a: 'Your uploaded source is stored on our infrastructure and used only to produce your architecture map and summaries. AI enrichment is optional — leave the API key empty and you still get the full deterministic analysis.',
  },
  {
    q: 'Can I manually add or annotate nodes?',
    a: 'Yes. The canvas supports adding nodes, editing labels and descriptions, and grouping entities — so you can layer your own annotations on top of the automatically generated map.',
  },
  {
    q: 'Is there an API?',
    a: 'The backend exposes a REST API for workspaces, projects, graph data, and analysis. Auth uses rotating access and refresh tokens delivered as httpOnly cookies.',
  },
  {
    q: 'What happens to my uploaded source files after analysis?',
    a: 'Source files are stored locally while the analysis runs and are removed by default once it completes. Keep-source mode is available if you want to retain extracted files for later inspection.',
  },
];

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-20 px-6 py-20 md:py-24">
      <SectionHeading
        kicker="FAQ"
        titleStrong="Everything you need"
        titleMuted="to know."
        subtitle="Common Questions"
      />

      <div className="space-y-3">
        {FAQS.map((faq, i) => {
          const open = openIndex === i;
          return (
            <div
              key={faq.q}
              className={`rounded-xl border bg-[var(--bg-card)] transition-colors ${
                open ? 'border-[var(--accent-border)]' : 'border-[var(--border-soft)]'
              }`}
            >
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={open}
              >
                <span className="text-sm font-bold text-[var(--text-1)]">{faq.q}</span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-2)] bg-[var(--bg-inset)] text-[var(--text-2)] transition-transform duration-300 ${
                    open ? 'rotate-45' : ''
                  }`}
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--text-3)]">{faq.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
