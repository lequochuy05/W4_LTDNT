export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Simulate network latency and random failures
export const simulateNetwork = async <T>(data: T, failProbability = 0): Promise<T> => {
  await delay(500 + Math.random() * 1000); // 0.5s to 1.5s delay
  
  if (Math.random() < failProbability) {
    throw new ApiError(500, 'Simulated network failure');
  }
  
  return data;
};
