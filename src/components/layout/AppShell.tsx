import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { SyncManager } from '../../features/sync/SyncManager';

export function AppShell() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <SyncManager />
      
      {/* Main content area with padding for navbar and bottom nav */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
