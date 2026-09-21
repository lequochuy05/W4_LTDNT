import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { SurveyPayload } from '../services/api/surveyApi';
import type { Facility } from '../services/api/facilityApi';

export interface SyncQueueItem {
  id: string;
  entityType: "SURVEY";
  entityId: string;
  operation: "CREATE" | "UPDATE";
  payload: SurveyPayload;
  status: "PENDING" | "SYNCING" | "SUCCESS" | "FAILED";
  retryCount: number;
  createdAt: string;
  lastAttemptAt?: string;
  error?: string;
}

export interface Survey extends SurveyPayload {
  id: string;
  inspectorId: string;
  status: "DRAFT" | "PENDING_SYNC" | "SYNCED" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

interface VKUSurveyDB extends DBSchema {
  surveys: {
    key: string;
    value: Survey;
    indexes: { 'by-status': string };
  };
  surveyDrafts: {
    key: string;
    value: Survey;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-status': string };
  };
  facilities: {
    key: string;
    value: Facility;
  };
  photos: {
    key: string;
    value: { id: string; base64: string; surveyId?: string };
  };
}

let dbPromise: Promise<IDBPDatabase<VKUSurveyDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VKUSurveyDB>('vku-field-survey-db', 1, {
      upgrade(db) {
        const surveyStore = db.createObjectStore('surveys', { keyPath: 'id' });
        surveyStore.createIndex('by-status', 'status');
        
        db.createObjectStore('surveyDrafts', { keyPath: 'id' });
        
        const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncQueueStore.createIndex('by-status', 'status');
        
        db.createObjectStore('facilities', { keyPath: 'id' });
        db.createObjectStore('photos', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};

// Completed Surveys Helpers
export const saveSurvey = async (survey: Survey) => {
  const db = await getDB();
  await db.put('surveys', survey);
};

export const getSurveys = async () => {
  const db = await getDB();
  return db.getAll('surveys');
};

// Facility Cache Helpers
export const cacheFacilities = async (facilities: Facility[]) => {
  const db = await getDB();
  const tx = db.transaction('facilities', 'readwrite');
  await Promise.all(facilities.map(f => tx.store.put(f)));
  await tx.done;
};

export const getCachedFacilities = async () => {
  const db = await getDB();
  return db.getAll('facilities');
};

// Survey Draft Helpers
export const saveDraft = async (draft: Survey) => {
  const db = await getDB();
  await db.put('surveyDrafts', draft);
};

export const getDrafts = async () => {
  const db = await getDB();
  return db.getAll('surveyDrafts');
};

export const getDraftById = async (id: string) => {
  const db = await getDB();
  return db.get('surveyDrafts', id);
};

export const deleteDraft = async (id: string) => {
  const db = await getDB();
  await db.delete('surveyDrafts', id);
};

// Sync Queue Helpers
export const addToSyncQueue = async (item: SyncQueueItem) => {
  const db = await getDB();
  await db.put('syncQueue', item);
};

export const getPendingSyncItems = async () => {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-status', 'PENDING');
};

export const markSyncItemStatus = async (id: string, status: SyncQueueItem['status'], error?: string) => {
  const db = await getDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    item.status = status;
    item.lastAttemptAt = new Date().toISOString();
    if (error) item.error = error;
    if (status === 'FAILED') item.retryCount++;
    await db.put('syncQueue', item);
  }
};
