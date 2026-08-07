import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Library, Settings } from 'lucide-react';
import { useEffect } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to setup if no base URL
  useEffect(() => {
    if (!localStorage.getItem('komga-base-url')) {
      navigate('/setup');
    }
  }, [navigate, location]);

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-2xl mx-auto overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 flex items-center justify-around bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe">
        <NavLink
          to="/libraries"
          className={({ isActive }) =>
            `flex flex-col items-center py-3 px-6 transition-colors ${
              isActive ? 'text-primary dark:text-purple-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`
          }
        >
          <Library size={24} />
          <span className="text-xs mt-1 font-medium">库</span>
        </NavLink>

        <NavLink
          to="/setup"
          className={({ isActive }) =>
            `flex flex-col items-center py-3 px-6 transition-colors ${
              isActive ? 'text-primary dark:text-purple-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`
          }
        >
          <Settings size={24} />
          <span className="text-xs mt-1 font-medium">设置</span>
        </NavLink>
      </nav>
    </div>
  );
}
