import { simulateNetwork } from './apiClient';
import { mockFacilities } from './mockData';

export interface Facility {
  id: string;
  name: string;
  type: string;
  location: string;
}

export const facilityApi = {
  getFacilities: async (): Promise<Facility[]> => {
    return simulateNetwork(mockFacilities);
  },
  
  getFacilityById: async (id: string): Promise<Facility | undefined> => {
    const facility = mockFacilities.find(f => f.id === id);
    if (!facility) throw new Error('Facility not found');
    return simulateNetwork(facility);
  }
};
