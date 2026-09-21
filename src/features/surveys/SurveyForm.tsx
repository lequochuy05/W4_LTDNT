import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, MapPin, Send } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation as CapacitorGeolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { facilityApi } from '../../services/api/facilityApi';
import { getCachedFacilities, saveDraft, deleteDraft, addToSyncQueue, getDraftById, saveSurvey } from '../../db/indexeddb';
import { surveyApi } from '../../services/api/surveyApi';
import type { SurveyPayload } from '../../services/api/surveyApi';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export function SurveyForm() {
  const [searchParams] = useSearchParams();
  const facilityId = searchParams.get('facilityId');
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();

  // Form State
  const [condition, setCondition] = useState<SurveyPayload['condition']>('GOOD');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  const { data: facility } = useQuery({
    queryKey: ['facility', facilityId],
    queryFn: async () => {
      if (!facilityId) return null;
      try {
        return await facilityApi.getFacilityById(facilityId);
      } catch {
        const cached = await getCachedFacilities();
        return cached.find(f => f.id === facilityId) || null;
      }
    },
    enabled: !!facilityId,
  });

  // Load existing draft
  useEffect(() => {
    if (facilityId) {
      getDraftById(facilityId).then(draft => {
        if (draft) {
          setCondition(draft.condition);
          setNotes(draft.notes || '');
          setPhotos(draft.photos || []);
          if (draft.latitude && draft.longitude) {
            setLocation({ lat: draft.latitude, lng: draft.longitude });
          }
        }
      });
    }
  }, [facilityId]);

  const submitMutation = useMutation({
    mutationFn: async (payload: SurveyPayload) => {
      if (isOnline) {
        return await surveyApi.submitSurvey(payload);
      } else {
        throw new Error('Offline');
      }
    },
    onSuccess: async (data, payload) => {
      await saveSurvey({
        ...payload,
        id: data.id,
        inspectorId: 'u1',
        status: 'SYNCED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (facilityId) await deleteDraft(facilityId);
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      alert('Survey submitted successfully!');
      navigate('/dashboard');
    },
    onError: async (_error, payload) => {
      // Offline fallback -> save to syncQueue
      const syncItem = {
        id: `sync_${Date.now()}`,
        entityType: 'SURVEY' as const,
        entityId: `srv_${Date.now()}`,
        operation: 'CREATE' as const,
        payload,
        status: 'PENDING' as const,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };
      await addToSyncQueue(syncItem);
      if (facilityId) await deleteDraft(facilityId);
      
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingSync'] });
      
      // Register background sync if supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const swRegistration = await navigator.serviceWorker.ready;
          // @ts-ignore
          await swRegistration.sync.register('sync-surveys');
        } catch (e) {
          console.error('Background Sync registration failed', e);
        }
      }
      
      alert('Saved locally. Will synchronize when connection is restored.');
      navigate('/dashboard');
    }
  });

  // Auto-save draft
  useEffect(() => {
    if (facilityId && facility && !submitMutation.isPending && !submitMutation.isSuccess) {
      const timer = setTimeout(() => {
        saveDraft({
          id: facilityId,
          facilityId,
          facilityName: facility.name,
          condition,
          notes,
          photos,
          latitude: location?.lat,
          longitude: location?.lng,
          inspectedAt: new Date().toISOString(),
          inspectorId: 'u1', // mock
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['drafts'] });
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [condition, notes, photos, location, facilityId, facility, queryClient, submitMutation.isPending, submitMutation.isSuccess]);

  const captureLocation = async () => {
    setIsCapturingLocation(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const position = await CapacitorGeolocation.getCurrentPosition({ enableHighAccuracy: true });
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsCapturingLocation(false);
      } else {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              setIsCapturingLocation(false);
            },
            (err) => {
              console.error(err);
              alert('Could not capture location');
              setIsCapturingLocation(false);
            },
            { enableHighAccuracy: true }
          );
        } else {
          alert('Geolocation not supported');
          setIsCapturingLocation(false);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Could not capture location');
      setIsCapturingLocation(false);
    }
  };

  const captureNativePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      if (image.dataUrl) {
        setPhotos(prev => [...prev, image.dataUrl as string]);
      }
    } catch (e) {
      console.error('Camera error:', e);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility) return;

    submitMutation.mutate({
      facilityId: facility.id,
      facilityName: facility.name,
      condition,
      notes,
      photos,
      latitude: location?.lat,
      longitude: location?.lng,
      inspectedAt: new Date().toISOString(),
    });
  };

  if (!facility) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">New Survey</h2>
        <p className="text-slate-500">{facility.name} • {facility.type}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Condition */}
        <div className="space-y-2">
          <label className="block font-semibold text-slate-700">Condition</label>
          <div className="grid grid-cols-2 gap-3">
            {['GOOD', 'FAIR', 'POOR', 'CRITICAL'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c as any)}
                className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                  condition === c 
                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-500/20' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* GPS */}
        <div className="space-y-2">
          <label className="block font-semibold text-slate-700">Location</label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={captureLocation}
              disabled={isCapturingLocation}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <MapPin className="w-5 h-5" />
              <span>{isCapturingLocation ? 'Capturing...' : 'Capture GPS'}</span>
            </button>
            {location && (
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                Recorded ✓
              </span>
            )}
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-2">
          <label className="block font-semibold text-slate-700">Photos</label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((p, idx) => (
              <div key={idx} className="relative aspect-square">
                <img src={p} alt="Captured" className="w-full h-full object-cover rounded-xl border border-slate-200" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm"
                >
                  ×
                </button>
              </div>
            ))}
            {Capacitor.isNativePlatform() ? (
              <button
                type="button"
                onClick={captureNativePhoto}
                className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:border-primary-400 hover:text-primary-600 transition-colors cursor-pointer"
              >
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-xs font-medium">Add Photo</span>
              </button>
            ) : (
              <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:border-primary-400 hover:text-primary-600 transition-colors cursor-pointer">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-xs font-medium">Add Photo</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
              </label>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block font-semibold text-slate-700">Notes (Optional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
            placeholder="Add any additional observations..."
          />
        </div>

        {/* Submit */}
        <div className="pt-4 pb-12">
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl flex justify-center items-center space-x-2 transition-colors disabled:opacity-70"
          >
            <Send className="w-5 h-5" />
            <span>{isOnline ? 'Submit Survey' : 'Save & Sync Later'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
