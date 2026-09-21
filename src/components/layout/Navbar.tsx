import { Wifi, WifiOff, LogOut } from 'lucide-react';
import { useNetworkStatus, toggleManualNetwork } from '../../hooks/useNetworkStatus';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export function Navbar() {
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    queryClient.clear();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center px-4 justify-between">
        <h1 className="text-lg font-semibold text-slate-900">VKU Survey</h1>
        <div className="flex items-center space-x-4">
          <div 
            className="flex items-center space-x-1 text-sm cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => toggleManualNetwork(!isOnline)}
            title="Click to toggle fake Offline mode for testing"
          >
            {isOnline ? (
              <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </span>
            ) : (
              <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </span>
            )}
          </div>
          {/* Mock Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
            H
          </div>
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
