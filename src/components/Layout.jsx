import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, ChartBar as BarChart3, Settings, Zap, Wallet, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const SIDEBAR_KEY = 'journalpro_sidebar_hidden';

function readHidden() {
  try { return localStorage.getItem(SIDEBAR_KEY) === '1'; } catch { return false; }
}

function writeHidden(v) {
  try { localStorage.setItem(SIDEBAR_KEY, v ? '1' : '0'); } catch { /* sin almacenamiento */ }
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/accounts', label: 'Cuentas', icon: Wallet },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavItem({ to, label, icon: Icon, end, mobile, collapsed }) {
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
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center rounded-xl text-sm font-medium transition-colors ${
          collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3.5 py-2.5'
        } ${
          isActive ? 'bg-brand-dim text-ink' : 'text-muted hover:text-ink hover:bg-surface-hi'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? 'text-brand' : ''} />
          {!collapsed && label}
        </>
      )}
    </NavLink>
  );
}

export default function Layout() {
  const [hidden, setHidden] = useState(readHidden);

  const toggle = () => {
    setHidden(h => { writeHidden(!h); return !h; });
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex">
      {/* Sidebar desktop: completo o solo iconos */}
      <aside className={`hidden md:flex md:flex-col border-r border-border bg-surface/60 shrink-0 sticky top-0 h-screen transition-[width] duration-200 ${hidden ? 'md:w-16' : 'md:w-60'}`}>
        <div className={`flex items-center h-16 border-b border-border ${hidden ? 'justify-center' : 'justify-between gap-2.5 px-5'}`}>
          {!hidden && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-dim flex items-center justify-center">
                <Zap size={16} className="text-brand" />
              </div>
              <span className="font-semibold tracking-tight text-[15px]">
                Journal<span className="text-brand">PRO</span>
              </span>
            </div>
          )}
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-faint hover:text-ink hover:bg-surface-hi"
            title={hidden ? 'Expandir menú' : 'Contraer menú'}
          >
            {hidden ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <nav className={`flex-1 space-y-1 ${hidden ? 'py-3 px-2' : 'p-3'}`}>
          {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} collapsed={hidden} />)}
        </nav>
        {!hidden && (
          <div className="p-4 border-t border-border text-[11px] text-faint">
            JournalPRO · Trading Journal
          </div>
        )}
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
