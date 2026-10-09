import React from 'react';
import { Radio, CheckCircle2, Trash2 } from 'lucide-react';
import { PullJob } from '../types/trade';

interface PullStatusBannerProps {
  job: PullJob;
  isRunning: boolean;
  onCancel?: () => void;
}

/**
 * Format timestamp into readable Indian Standard Time string
 */
const formatTimeIST = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

/**
 * Active background pull job progress banner.
 * Visualizes live job status, start time in IST, and total records processed so far.
 */
export const PullStatusBanner: React.FC<PullStatusBannerProps> = ({
  job,
  isRunning,
  onCancel,
}) => {
  return (
    <section className={`job ${isRunning ? 'job-running' : ''}`}>
      <div className="job-symbol">
        <Radio size={19} />
      </div>

      <div className="job-main">
        <div className="job-title">
          Current pull{' '}
          <span className={`pill ${job.status.toLowerCase()}`}>{job.status}</span>
        </div>

        <div className="job-meta">
          {job.startedAt ? `Started ${formatTimeIST(job.startedAt)}` : 'Waiting to start'}{' '}
          <span>·</span> {job.totalRecords.toLocaleString('en-IN')} records processed
        </div>
      </div>

      {isRunning && <span className="progress-label">Processing</span>}
      {job.status === 'COMPLETED' && <CheckCircle2 className="success" size={19} />}

      {onCancel && (
        <button
          className="ghost"
          onClick={onCancel}
          title="Remove pull"
          style={{ marginLeft: '12px', padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
        >
          <Trash2 size={15} /> Remove
        </button>
      )}
    </section>
  );
};
