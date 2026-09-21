import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getPendingSyncItems, markSyncItemStatus, saveSurvey } from '../../db/indexeddb';
import { surveyApi } from '../../services/api/surveyApi';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export function SyncManager() {
  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    if (!isOnline) return;

    const processSyncQueue = async () => {
      const items = await getPendingSyncItems();
      if (items.length === 0) return;

      setSyncStatus('SYNCING');
      setSyncMessage(`Synchronizing ${items.length} surveys...`);

      let successCount = 0;
      let failCount = 0;

      for (const item of items) {
        try {
          if (item.operation === 'CREATE' && item.entityType === 'SURVEY') {
            const data = await surveyApi.submitSurvey(item.payload as any);
            await saveSurvey({
              ...(item.payload as any),
              id: data.id,
              inspectorId: 'u1',
              status: 'SYNCED',
              createdAt: item.createdAt,
              updatedAt: new Date().toISOString(),
            });
            await markSyncItemStatus(item.id, 'SUCCESS');
            successCount++;
          }
        } catch (error) {
          console.error('Failed to sync item', item.id, error);
          await markSyncItemStatus(item.id, 'FAILED', (error as Error).message);
          failCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['pendingSync'] });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      
      if (failCount === 0) {
        setSyncStatus('SUCCESS');
        setSyncMessage(`All ${successCount} surveys synchronized.`);
      } else {
        setSyncStatus('ERROR');
        setSyncMessage(`${failCount} surveys failed to synchronize.`);
      }

      setTimeout(() => {
        setSyncStatus('IDLE');
      }, 5000);
    };

    // Delay slightly to ensure network is truly up
    const timer = setTimeout(processSyncQueue, 1000);
    return () => clearTimeout(timer);
  }, [isOnline, queryClient]);

  if (syncStatus === 'IDLE') return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg pointer-events-auto transition-all ${
        syncStatus === 'SYNCING' ? 'bg-blue-600 text-white' :
        syncStatus === 'SUCCESS' ? 'bg-green-600 text-white' :
        'bg-red-600 text-white'
      }`}>
        {syncStatus === 'SYNCING' && <RefreshCw className="w-5 h-5 animate-spin" />}
        {syncStatus === 'SUCCESS' && <CheckCircle2 className="w-5 h-5" />}
        {syncStatus === 'ERROR' && <AlertCircle className="w-5 h-5" />}
        <span className="font-medium text-sm">{syncMessage}</span>
      </div>
    </div>
  );
}
