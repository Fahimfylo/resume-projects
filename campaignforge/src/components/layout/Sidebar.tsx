import React, { useState, useRef } from 'react';
import { useApp } from '../../context/useApp';
import { SIDEBAR_ITEMS } from '../../constants';
import { Home, LayoutGrid, Kanban, FileText, Calendar, BarChart3, HelpCircle, LogOut } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Dashboard: Home,
  'Project Strategy': LayoutGrid,
  'Tasks Board': Kanban,
  'Content Library': FileText,
  '30-Day Calendar': Calendar,
  'Performance Analytics': BarChart3,
};

export function Sidebar() {
  const { currentPath, navigateTo, activeProjectId, user, confirm, logout, projects } = useApp();
  const [avatarError, setAvatarError] = useState(false);
  const [tooltipLabel, setTooltipLabel] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>();

  const hasWorkspaces = projects.length > 0;

  const handleLogout = () => {
    confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out? You can sign back in anytime.',
      confirmLabel: 'Sign Out',
      destructive: true,
      onConfirm: logout,
    });
  };
  const displayName = user?.name || (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ') : 'User');
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleNav = (item: typeof SIDEBAR_ITEMS[number]) => {
    if (item.path === '/workspace') {
      if (!hasWorkspaces) return;
      if (!activeProjectId) {
        navigateTo('/dashboard');
        return;
      }
      navigateTo('/workspace', { id: activeProjectId, tab: item.tab || 'strategy' });
    } else {
      navigateTo(item.path);
    }
  };

  const showTooltip = (label: string, e: React.MouseEvent) => {
    if (hasWorkspaces) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
    setTooltipLabel(label);
  };

  const hideTooltip = () => setTooltipLabel(null);

  const isActive = (item: typeof SIDEBAR_ITEMS[number]) => {
    if (item.path === '/workspace') {
      if (!currentPath.startsWith('/workspace')) return false;
      const currentTab = new URLSearchParams(window.location.search).get('tab') || 'strategy';
      return currentTab === item.tab;
    }
    return currentPath === item.path;
  };

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 bg-[#F0EEE8] border-r border-black/5 h-[calc(100vh-3.5rem)] sticky top-14 p-4 shrink-0 justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">Campaign Navigation</span>
            <nav className="mt-2 space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const active = isActive(item);
                const Icon = iconMap[item.label];
                return (
                  <button
                    key={item.label}
                    onMouseEnter={(e) => { if (item.path === '/workspace') showTooltip(item.label, e); }}
                    onMouseLeave={hideTooltip}
                    onClick={() => handleNav(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active ? 'bg-black/8 text-neutral-900 font-semibold' : 'text-neutral-500 hover:bg-black/4 hover:text-neutral-900'
                    }`}
                  >
                    {Icon && <Icon size={16} className={active ? 'text-neutral-900' : 'text-neutral-400'} />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="pt-4 border-t border-black/5">
            <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">Workspace Controls</span>
            <nav className="mt-2 space-y-1">
              <button onClick={() => navigateTo('/onboarding')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-black/4 hover:text-neutral-900 transition-all text-left">
                <HelpCircle size={16} className="text-neutral-400" />
                <span>Onboarding Wizard</span>
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-all text-left">
                <LogOut size={16} />
                <span>Exit</span>
              </button>
            </nav>
          </div>
        </div>
        <button onClick={() => { setAvatarError(false); navigateTo('/profile'); }} className="w-full p-3 bg-white/40 border border-black/5 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/60 transition-all text-left">
          {user?.avatarUrl && !avatarError ? (
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" onError={() => setAvatarError(true)} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-xs font-black text-neutral-800 shrink-0">{initials}</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-neutral-900 truncate">{displayName}</div>
            <div className="text-[10px] text-neutral-400 truncate">{user?.email || ''}</div>
          </div>
          <span className="text-[9px] font-bold bg-[#1A1A1A] text-white px-1.5 py-0.5 rounded uppercase shrink-0">Pro</span>
        </button>
      </aside>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#F0EEE8]/95 backdrop-blur-md border-t border-black/10 z-30 flex items-center justify-around px-2">
        {SIDEBAR_ITEMS.slice(0, 5).map((item) => {
          const active = isActive(item);
          const Icon = iconMap[item.label];
          return (
            <button
              key={item.label}
              onMouseEnter={(e) => { if (item.path === '/workspace') showTooltip(item.label, e); }}
              onMouseLeave={hideTooltip}
              onClick={() => handleNav(item)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${active ? 'text-neutral-900 scale-105' : 'text-neutral-400'}`}
            >
              {Icon && <Icon size={18} className={active ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />}
              <span className="text-[9px] font-medium tracking-tight mt-1">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
      {tooltipLabel && !hasWorkspaces && (
        <span
          className="fixed px-2.5 py-1.5 rounded-lg bg-neutral-900 text-white text-[10px] font-mono whitespace-nowrap shadow-lg z-[100] pointer-events-none"
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateY(-50%)' }}
        >
          Create a workspace first
        </span>
      )}
    </>
  );
}
