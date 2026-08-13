import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/useApp';
import { Menu, Search, Compass, LogIn } from 'lucide-react';

export function HeaderNav() {
  const { currentPath, navigateTo, setMenuOverlayOpen, setCommandPaletteOpen, projects, activeProjectId, user } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setAvatarError(false); }, [user?.avatarUrl]);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const isAppView = currentPath === '/dashboard' || currentPath.startsWith('/workspace');
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  if (isAppView) {
    return (
      <header
        className={`sticky top-0 z-30 h-[66px] flex items-center justify-between px-6 bg-transparent backdrop-blur-md transition-all duration-200 border-b ${isScrolled ? 'border-black/10' : 'border-transparent'}`}
        id="app-header-nav"
      >
        <div className="flex items-center gap-2">
          <button onClick={() => navigateTo('/dashboard')} className="text-xs font-medium text-neutral-500 hover:text-black transition-colors">
            Projects
          </button>
          <span className="text-neutral-300 text-xs">→</span>
          <span className="text-xs font-semibold text-neutral-900 truncate max-w-[180px] sm:max-w-none">
            {currentPath.startsWith('/workspace') && activeProject ? activeProject.name : 'All Workspaces'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECEAE3] hover:bg-[#E8E6DF] border border-black/5 text-neutral-500 hover:text-neutral-900 transition-all text-xs"
            title="Search (Cmd+K)"
          >
            <Search size={13} />
            <span className="hidden sm:inline font-mono text-[10px] text-neutral-400">⌘K</span>
          </button>
          <button onClick={() => navigateTo('/onboarding')} className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-full text-xs font-semibold tracking-tight transition-all active:scale-95">
            New project ↗
          </button>
          <button onClick={() => setMenuOverlayOpen(true)} className="p-1.5 hover:bg-black/5 rounded-full text-neutral-700 sm:hidden">
            <Menu size={18} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <nav
      className={`sticky top-0 z-40 h-[66px] flex items-center justify-between px-6 md:px-12 bg-transparent backdrop-blur-md transition-all duration-200 border-b ${isScrolled ? 'border-[#111111]/8 shadow-sm' : 'border-transparent'}`}
      id="marketing-header-nav"
    >
      <div className="flex flex-col items-start cursor-pointer" onClick={() => navigateTo('/')}>
        <span className="text-sm font-black tracking-tighter text-[#111111]">MOMENTUM</span>
        <span className="hidden sm:block text-[9px] font-mono tracking-widest text-neutral-400 uppercase mt-0.5">AI EXECUTION PLATFORM</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-medium tracking-wide text-neutral-500 hover:text-[#111111] transition-all">How it works</button>
        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-medium tracking-wide text-neutral-500 hover:text-[#111111] transition-all">Features</button>
        <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-medium tracking-wide text-neutral-500 hover:text-[#111111] transition-all">Pricing</button>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <button onClick={() => navigateTo('/dashboard')} className="w-8 h-8 rounded-full bg-neutral-900/10 text-neutral-800 text-xs font-black flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity">
            {user.avatarUrl && !avatarError ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
            ) : userInitial}
          </button>
        ) : (
          <>
            <button onClick={() => navigateTo('/sign-in')} className="hidden sm:inline-flex items-center justify-center px-5 py-2 rounded-[9999px] bg-transparent text-[#111111] font-medium text-xs border border-[rgba(17,17,17,0.2)] cursor-pointer transition-all duration-200 hover:bg-[rgba(17,17,17,0.05)] hover:border-[rgba(17,17,17,0.35)]">
              Sign in
            </button>
            <button onClick={() => navigateTo('/onboarding')} className="inline-flex items-center justify-center px-4 py-2 rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-xs tracking-[0.01em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px]">
              Start free ↗
            </button>
          </>
        )}
        <button onClick={() => setMenuOverlayOpen(true)} className="p-2 hover:bg-black/5 rounded-full text-[#111111]" id="global-menu-trigger">
          <Menu size={18} />
        </button>
      </div>
    </nav>
  );
}
