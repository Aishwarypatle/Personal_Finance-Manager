'use client';

import { ArrowLeftRight, BookUser, ChartNoAxesCombined, LayoutDashboard, Settings, UsersRound } from 'lucide-react';
import { BrandMark } from '@/components/brand/BrandMark';
import { Skeleton } from '@/components/shared/Skeleton';
import { formatCurrency } from '@/lib/format';
import type { PageName } from '@/lib/types';

const navigation = [
  ['Overview', LayoutDashboard],
  ['Transactions', ArrowLeftRight],
  ['KhataBook', BookUser],
  ['Groups', UsersRound],
  ['Reports', ChartNoAxesCombined],
] as const;

type Props = {
  page: PageName;
  isOpen: boolean;
  khataCount: number;
  groupCount: number;
  receivable: number;
  payable: number;
  isLoading?: boolean;
  onNavigate: (page: PageName) => void;
  onClose: () => void;
};

export function AppSidebar({ page, isOpen, khataCount, groupCount, receivable, payable, isLoading = false, onNavigate, onClose }: Props) {
  const navigate = (target: PageName) => {
    onNavigate(target);
    onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
      <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); navigate('Overview'); }}>
        <span className="brand-icon"><BrandMark size={22} /></span>
        <span>ledger<span className="brand-dot">.</span><small>PERSONAL FINANCE</small></span>
      </a>
      <div className="side-label">MENU</div>
      <nav>
        {navigation.map(([name, Icon]) => (
          <button type="button" key={name} className={`nav-item ${page === name ? 'active' : ''}`} onClick={() => navigate(name)}>
            <Icon size={18} />{name}
            {name === 'KhataBook' && (isLoading ? <Skeleton className="nav-count h-3.5 w-5 rounded-full" /> : <span className="nav-count">{khataCount}</span>)}
            {name === 'Groups' && (isLoading ? <Skeleton className="nav-count h-3.5 w-5 rounded-full" /> : <span className="nav-count">{groupCount}</span>)}
          </button>
        ))}
      </nav>
      <div className="side-label accounts-label">KHATA SUMMARY</div>
      <div className="khata-side">
        <div><i className="side-mark lent-mark !text-green-700">↑</i><span>To receive<small>{isLoading ? <Skeleton className="mt-0.5 h-3 w-14" /> : formatCurrency(receivable)}</small></span></div>
        <div><i className="side-mark borrow-mark !text-red-900">↓</i><span>To pay<small>{isLoading ? <Skeleton className="mt-0.5 h-3 w-14" /> : formatCurrency(payable)}</small></span></div>
      </div>
      <div className="sidebar-bottom">
        <div className="secure-card"><span className="secure-dot" /><div>Just you & your money<small>Your records stay on your server.</small></div></div>
        <button type="button" className={`nav-item settings ${page === 'Settings' ? 'active' : ''}`} onClick={() => navigate('Settings')}><Settings size={17}/>Settings</button>
        <div className="profile"><div className="avatar">AP</div><span>Aishwary Patle<small>Personal account</small></span></div>
      </div>
    </aside>
  );
}
