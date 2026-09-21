import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { facilityApi } from '../../services/api/facilityApi';
import { getCachedFacilities, cacheFacilities } from '../../db/indexeddb';

export function FacilityList() {
  const [search, setSearch] = useState('');

  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      try {
        const data = await facilityApi.getFacilities();
        await cacheFacilities(data); // Cache for offline use
        return data;
      } catch (error) {
        // If offline, fallback to cache
        console.log('Falling back to facility cache');
        return await getCachedFacilities();
      }
    },
  });

  const filtered = facilities.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800">Select Facility</h2>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search facilities..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading facilities...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(facility => (
            <Link
              key={facility.id}
              to={`/surveys/new?facilityId=${facility.id}`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-300 transition-colors shadow-sm"
            >
              <div className="flex items-start space-x-3">
                <div className="bg-primary-50 p-2 rounded-lg mt-0.5">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{facility.name}</h3>
                  <p className="text-sm text-slate-500">{facility.type} • {facility.location}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
          ))}
          
          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-500">No facilities found.</div>
          )}
        </div>
      )}
    </div>
  );
}
