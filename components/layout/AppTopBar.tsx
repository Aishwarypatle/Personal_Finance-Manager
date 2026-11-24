'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        profileTriggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileMenuOpen]);

  const openSettings = () => {
    setProfileMenuOpen(false);
    onOpenSettings();
  };

  const logout = () => {
    setProfileMenuOpen(false);
    onLogout();
  };

  return (
    <header className="topbar flex h-[65px] items-center justify-between px-[43px] max-[1100px]:px-[25px] max-[820px]:justify-start max-[820px]:gap-[15px] max-[560px]:h-[55px] max-[560px]:px-[15px]">
      <button type="button" className="mobile-menu" aria-label="Open navigation" onClick={onToggleMenu}><Menu /></button>
      <div className="crumb">Personal <span>/</span> <b>{page}</b></div>
      <div className="top-right">
        <span className={`db-status ${databaseStatus}`}><i />{databaseStatus === 'connected' ? 'Server connected' : databaseStatus === 'connecting' ? 'Connecting…' : 'Database setup needed'}</span>
        <span className="date-top"><CalendarDays size={15} />{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        <button type="button" className="icon-button flex items-center gap-1.5 whitespace-nowrap text-[10px] disabled:cursor-not-allowed disabled:opacity-60" onClick={onRefresh} disabled={isRefreshing} aria-busy={isRefreshing} aria-label="Refresh all finance data" title="Refresh all finance data">
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          {/* {isRefreshing ? '…' : ''} */}
        </button>
        <button type="button" className="icon-button theme-toggle" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggleTheme}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
        <div className="profile-menu-wrap" ref={profileMenuRef}>
          <button
            ref={profileTriggerRef}
            type="button"
            className="avatar mini profile-trigger"
            aria-label="Open profile options"
            aria-expanded={profileMenuOpen}
            aria-controls="profile-options-menu"
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            AP
          </button>
          {profileMenuOpen && (
            <div id="profile-options-menu" className="profile-dropdown" role="group" aria-label="Profile options">
              <div className="profile-dropdown-heading">
                <span className="avatar">AP</span>
                <span><b>Aishwary Patle</b><small>Personal account</small></span>
              </div>
              <button type="button" className="profile-dropdown-action" onClick={openSettings}>
                <Settings size={16} /> Settings
              </button>
              {showLogout && (
                <button type="button" className="profile-dropdown-action logout-action" onClick={logout} disabled={isLoggingOut} aria-busy={isLoggingOut}>
                  <LogOut size={16} /> {isLoggingOut ? 'Logging out…' : 'Logout'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
