import { useEffect, useState, useRef } from 'react';
import { RxCross2 } from "react-icons/rx";
import LogoutButton from './LogoutButton';

export default function ThemeSettings({ toggleThemeSettings }) {
  const panelRef = useRef(null);
  // Initialize theme directly from localStorage to prevent flash on mount
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light';
  });

  // Set the theme in localStorage and update classes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-slate-950', 'text-slate-100');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Toggle theme when the checkbox is changed
  const handleToggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        toggleThemeSettings();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [toggleThemeSettings]);

  return (
    <div
      ref={panelRef}
      id="ui-div"
      className="z-50 border-l border-gray-600 dark:bg-gray-950/80 z-sticky shadow-soft-3xl w-80 ease-soft fixed top-0 left-auto flex h-full min-w-0 flex-col break-words rounded-none border-0 bg-white/80 bg-clip-border px-2.5 backdrop-blur-2xl backdrop-saturate-200 duration-200 right-0"
    >
      <div className="px-6 pt-4 pb-0 mb-0 border-b-0 rounded-t-2xl">
        <div className="float-left">
          <h5 className="mt-4 mb-0 dark:text-white">Soft UI Configurator</h5>
          <p className="dark:text-white dark:opacity-60">See our dashboard options.</p>
        </div>
        <div className="float-right mt-6">
          <button

            onClick={toggleThemeSettings}
            className="inline-block p-1 mb-4 font-bold text-center uppercase align-middle transition-al border-0 rounded-full shadow-none cursor-pointer hover:scale-102 leading-pro text-xs ease-soft-in tracking-tight-soft bg-150 bg-x-25 active:opacity-85 text-white bg-slate-700 dark:text-slate-700 dark:bg-white"
          >
            <RxCross2 />
          </button>
        </div>
      </div>
      <hr className="h-px mx-0 my-1 bg-gradient-to-r dark:bg-gradient-to-r" />
      <div className="flex-auto p-6 pt-0 sm:pt-4">
        <div className="mt-4 flex justify-between items-center">
          <span className="text-center pr-4">Light / Dark</span>

          <div className="min-h-6  block pl-0 mb-5">
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={handleToggleTheme}
              />
              <span className="slider"></span>
            </label>

          </div>

        </div>
      </div>
      <div className='p-4'>
        <LogoutButton />
      </div>
    </div>
  );
}
