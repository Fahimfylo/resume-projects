import React from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Mail, Github, Globe } from 'lucide-react';

const COMPANY_DETAILS = [
  { label: 'ghost-studio-iota.vercel.app', href: 'https://ghost-studio-iota.vercel.app/', icon: Globe },
  { label: 'ghostpy91@gmail.com', href: 'mailto:ghostpy91@gmail.com', icon: Mail },
  { label: 'github.com/Fahimfylo', href: 'https://github.com/Fahimfylo', icon: Github },
];

const FOOTER_COLUMNS: { title: string; links: string[] }[] = [
  { title: 'Product', links: ['Architecture Canvas', 'Evidence', 'AI Insights', 'Pricing'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers'] },
  { title: 'Legal', links: ['Privacy', 'Terms'] },
];

export const HomeFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border-soft)] bg-[var(--bg-app)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--text-strong)] shadow-lg shadow-indigo-600/30">
                <Boxes className="h-5 w-5" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-[var(--text-strong)]">
                ArchFlow
              </span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[var(--text-4)]">
              Visual architecture maps for real codebases — every connection explained by evidence.
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="text-xs font-bold text-[var(--text-1)]">Built by Ghost Studio</div>
              {COMPANY_DETAILS.map(({ label, href, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  className="flex items-center gap-2 text-xs text-[var(--text-4)] transition-colors hover:text-[var(--accent-text)]"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-5)]">
                  {col.title}
                </div>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-xs text-[var(--text-4)] transition-colors hover:text-[var(--text-2)]">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-6 sm:flex-row">
          <p className="text-xs text-[var(--text-4)]">
            © {year} ArchFlow · Ghost Studio. All rights reserved.
          </p>
          <p className="text-xs text-[var(--text-4)]">
            <Link to="/login" className="transition-colors hover:text-[var(--text-2)]">
              Log in
            </Link>{' '}
            ·{' '}
            <Link to="/signup" className="transition-colors hover:text-[var(--text-2)]">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};
