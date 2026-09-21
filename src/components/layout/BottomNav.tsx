import { Home, MapPin, User, FileText } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function BottomNav() {
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/facilities', icon: MapPin, label: 'Facilities' },
    { to: '/surveys/history', icon: FileText, label: 'History' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-slate-200 safe-area-bottom">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `inline-flex flex-col items-center justify-center px-5 hover:bg-slate-50 group ${
                  isActive ? 'text-primary-600' : 'text-slate-500'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
