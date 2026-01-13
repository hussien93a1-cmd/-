import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, FileText, 
  Settings, DollarSign, ChefHat, LogOut, Grid
} from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: <LayoutGrid size={24} />, label: 'الكاشير (POS)' },
    { to: '/tables', icon: <Grid size={24} />, label: 'الطاولات والسفري' },
    // Removed Menu link as requested
    { to: '/reports', icon: <FileText size={24} />, label: 'التقارير' },
    { to: '/finance', icon: <DollarSign size={24} />, label: 'الحسابات' },
    { to: '/settings', icon: <Settings size={24} />, label: 'الإعدادات' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-24 md:w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20 transition-all">
        <div className="p-6 flex items-center justify-center md:justify-start gap-3 border-b border-slate-700">
          <ChefHat size={32} className="text-primary" />
          <h1 className="hidden md:block text-xl font-bold tracking-wider">كباب الديرة</h1>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                  ? 'bg-primary text-white shadow-lg shadow-emerald-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span className="hidden md:block font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 w-full rounded-lg hover:bg-slate-800 transition-colors">
            <LogOut size={20} />
            <span className="hidden md:block">تسجيل خروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-14 flex items-center justify-between px-6 z-10 print:hidden">
          <h2 className="text-lg font-bold text-gray-700">
            {navItems.find(i => i.to === location.pathname)?.label || 'الرئيسية'}
          </h2>
          <div className="flex items-center gap-4">
             <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
             <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
               A
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50/50 print:p-0 print:bg-white">
           <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;