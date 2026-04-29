export interface Worker {
  id: string;
  name: string;
  safePassExpiry: Date;
  cscsCards: string[];
  rctRate: 0 | 20 | 35;
}

export interface Job {
  id: string;
  title: string;
  tradeType: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  escrowStatus: 'held' | 'released' | 'disputed';
  payAmount: number;
}

export interface Rating {
  workerId: string;
  jobId: string;
  reliabilityScore: number; // 0–1
  qualityScore: number;     // 1–5
  isNoShow: boolean;
}
