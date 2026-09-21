import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Clock, UploadCloud } from 'lucide-react';
import { getDrafts, getPendingSyncItems, getSurveys } from '../../db/indexeddb';
import { authApi } from '../../services/api/authApi';

export function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not logged in');
      return authApi.getCurrentUser(token);
    },
  });

  const { data: drafts = [] } = useQuery({ queryKey: ['drafts'], queryFn: getDrafts });
  const { data: pendingSync = [] } = useQuery({ queryKey: ['pendingSync'], queryFn: getPendingSyncItems });
  const { data: surveys = [] } = useQuery({ queryKey: ['surveys'], queryFn: getSurveys });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        {user?.avatar && (
          <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-800">Hello, {user?.name || 'User'}</h2>
          <p className="text-sm text-slate-500">{user?.role || 'Inspector'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <UploadCloud className="w-6 h-6 text-orange-500" />
            <span className="text-2xl font-bold text-orange-700">{pendingSync.length}</span>
          </div>
          <p className="text-sm font-medium text-orange-800">Pending Sync</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-blue-500" />
            <span className="text-2xl font-bold text-blue-700">{drafts.length}</span>
          </div>
          <p className="text-sm font-medium text-blue-800">Drafts</p>
        </div>
      </div>

      <Link
        to="/facilities"
        className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-4 flex items-center justify-center space-x-2 transition-colors shadow-sm"
      >
        <Plus className="w-5 h-5" />
        <span className="font-semibold">New Survey</span>
      </Link>

      <div>
        <h3 className="font-semibold text-slate-800 mb-3">Recent Surveys</h3>
        {surveys.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {surveys.slice(0, 3).map(survey => (
              <div key={survey.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-800">{survey.facilityName}</p>
                  <p className="text-xs text-slate-500">{new Date(survey.createdAt).toLocaleString()}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  survey.condition === 'GOOD' ? 'bg-green-100 text-green-700' :
                  survey.condition === 'FAIR' ? 'bg-yellow-100 text-yellow-700' :
                  survey.condition === 'POOR' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {survey.condition}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-100 rounded-xl p-6 text-center text-slate-500 text-sm">
            No recent surveys.
          </div>
        )}
      </div>
    </div>
  );
}
