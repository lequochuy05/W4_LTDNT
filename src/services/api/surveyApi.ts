import { simulateNetwork } from './apiClient';

export interface SurveyPayload {
  facilityId: string;
  facilityName: string;
  condition: "GOOD" | "FAIR" | "POOR" | "CRITICAL";
  notes?: string;
  photos: string[]; // base64 or paths
  latitude?: number;
  longitude?: number;
  inspectedAt: string;
}

export const surveyApi = {
  submitSurvey: async (_payload: SurveyPayload): Promise<{ id: string, status: string }> => {
    // Simulate successful creation on the backend
    return simulateNetwork({
      id: 'srv_' + Date.now(),
      status: 'SYNCED',
    }, 0.1); // 10% chance of random network failure to test sync
  }
};
