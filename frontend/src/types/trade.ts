/**
 * Trade data object returned from BSE API feed and stored in database
 */
export interface Trade {
  tradeId: string;
  client: string;
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string; // ISO string format
}

/**
 * Background pull job status object
 */
export interface PullJob {
  jobId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedCompletionAt?: string | null;
  delaySeconds?: number;
  totalRecords: number;
  error?: string | null;
}

/**
 * WebSocket real-time message payload
 */
export interface WebSocketEvent {
  type: 'PULL_STARTED' | 'PULL_STATUS' | 'TRADES_ADDED' | 'PULL_COMPLETED' | 'PULL_FAILED' | 'PULL_CANCELLED';
  data: any;
}
