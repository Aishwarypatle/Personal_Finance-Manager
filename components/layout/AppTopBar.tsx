'use client';

import { CalendarDays, LogOut, Menu, Moon, RefreshCw, Settings, Sun } from 'lucide-react';
import type { DatabaseStatus, PageName } from '@/lib/types';

type Props = {
  page: PageName;
  databaseStatus: DatabaseStatus;
  darkMode: boolean;
  showLogout: boolean;
  isLoggingOut: boolean;
  isRefreshing: boolean;
  onToggleMenu: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onRefresh: () => void;
};

export function AppTopBar({ page, databaseStatus, darkMode, showLogout, isLoggingOut, isRefreshing, onToggleMenu, onToggleTheme, onOpenSettings, onLogout, onRefresh }: Props) {
  return (
    <header className="topbar flex h-[65px] items-center justify-between px-[43px] max-[1100px]:px-[25px] max-[820px]:justify-start max-[820px]:gap-[15px] max-[560px]:h-[55px] max-[560px]:px-[15px]">
      <button type="button" className="mobile-menu" aria-label="Open navigation" onClick={onToggleMenu}><Menu /></button>
      <div className="crumb">Personal <span>/</span> <b>{page}</b></div>
      <div className="top-right">
        <span className={`db-status ${databaseStatus}`}><i />{databaseStatus === 'connected' ? 'Server connected' : databaseStatus === 'connecting' ? 'Connecting…' : 'Database setup needed'}</span>
        <span className="date-top"><CalendarDays size={15} />{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        <button type="button" className="icon-button flex items-center gap-1.5 whitespace-nowrap text-[10px] disabled:cursor-not-allowed disabled:opacity-60" onClick={onRefresh} disabled={isRefreshing} aria-busy={isRefreshing} aria-label="Refresh all finance data" title="Refresh all finance data">
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
        {showLogout && (
          <button type="button" className="icon-button flex items-center gap-1 whitespace-nowrap text-[10px] disabled:cursor-not-allowed disabled:opacity-60" onClick={onLogout} disabled={isLoggingOut} aria-busy={isLoggingOut} aria-label="Log out" title="Log out">
            <LogOut size={15} />
            <span className="max-[400px]:hidden">{isLoggingOut ? 'Logging out…' : 'Logout'}</span>
          </button>
        )}
        <button type="button" className="icon-button theme-toggle" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggleTheme}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
        <button type="button" className="icon-button" aria-label="Open settings" onClick={onOpenSettings}><Settings size={18} /></button>
        <div className="avatar mini" aria-label="Personal account">AP</div>
      </div>
    </header>
  );
}
