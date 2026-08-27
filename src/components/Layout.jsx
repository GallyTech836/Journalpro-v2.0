import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, ChartBar as BarChart3, Settings, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavItem({ to, label, icon: Icon, end, mobile }) {
  if (mobile) {
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 flex-1 py-2.5 text-[10px] font-semibold transition-colors ${
            isActive ? 'text-brand' : 'text-muted'
          }`
        }
      >
        <Icon size={20} />
        {label}
      </NavLink>
    );
  }
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-dim text-ink' : 'text-muted hover:text-ink hover:bg-surface-hi'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? 'text-brand' : ''} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col border-r border-border bg-surface/60 shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-brand-dim flex items-center justify-center">
            <Zap size={16} className="text-brand" />
          </div>
          <span className="font-semibold tracking-tight text-[15px]">
            Journal<span className="text-brand">PRO</span>
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
        </nav>
        <div className="p-4 border-t border-border text-[11px] text-faint">
          JournalPRO · Trading Journal
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar mobile */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-2.5 px-4 h-14 border-b border-border bg-canvas/90 backdrop-blur-xl">
          <div className="w-7 h-7 rounded-lg bg-brand-dim flex items-center justify-center">
            <Zap size={14} className="text-brand" />
          </div>
          <span className="font-semibold tracking-tight text-sm">
            Journal<span className="text-brand">PRO</span>
          </span>
        </div>

        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Bottom nav mobile */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex bg-surface/95 backdrop-blur-xl border-t border-border">
          {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} mobile />)}
        </nav>
      </div>
    </div>
  );
}
