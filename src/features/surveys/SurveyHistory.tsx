import { useQuery } from '@tanstack/react-query';
import { getDrafts, getPendingSyncItems, getSurveys } from '../../db/indexeddb';
import { Clock, UploadCloud, CheckCircle2 } from 'lucide-react';

export function SurveyHistory() {
  const { data: drafts = [] } = useQuery({ queryKey: ['drafts'], queryFn: getDrafts });
  const { data: pendingSync = [] } = useQuery({ queryKey: ['pendingSync'], queryFn: getPendingSyncItems });
  const { data: surveys = [] } = useQuery({ queryKey: ['surveys'], queryFn: getSurveys });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Survey History</h2>

      {/* Pending Sync */}
      {pendingSync.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-orange-700 flex items-center gap-2">
            <UploadCloud className="w-5 h-5" /> Pending Synchronization
          </h3>
          <div className="space-y-2">
            {pendingSync.map(item => (
              <div key={item.id} className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-semibold text-orange-900">{item.payload.facilityName}</p>
                  <p className="text-xs text-orange-700 mt-1">Queued: {new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-xs font-bold bg-orange-200 text-orange-800 px-2 py-1 rounded">PENDING</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drafts */}
      {drafts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-blue-700 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Local Drafts
          </h3>
          <div className="space-y-2">
            {drafts.map(draft => (
              <div key={draft.id} className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-semibold text-blue-900">{draft.facilityName}</p>
                  <p className="text-xs text-blue-700 mt-1">Last edited: {new Date(draft.updatedAt).toLocaleString()}</p>
                </div>
                <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded">DRAFT</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Synced History */}
      {surveys.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" /> Completed
          </h3>
          <div className="space-y-2">
            {surveys.map(survey => (
              <div key={survey.id} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800">{survey.facilityName}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(survey.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">SYNCED</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          No completed surveys found.
        </div>
      )}
    </div>
  );
}
