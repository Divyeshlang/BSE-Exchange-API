import React from 'react';
import { TrendingUp } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  now: Date;
}

/**
 * Topbar Header component displaying BSE brand logo, WebSocket connection status,
 * and a live ticking clock in Indian Standard Time (IST - Mumbai).
 */
export const Header: React.FC<HeaderProps> = ({ connected, now }) => {
  return (
    <header className="topbar">
      <a className="brand" href="#">
        <span className="brand-mark">
          <TrendingUp size={21} />
        </span>
        <span>
          <b>BSE</b>
          <small>TRADE INTELLIGENCE</small>
        </span>
      </a>

      <div className="top-right">
        {/* WebSocket Connection Status Indicator */}
        <span className={`connection ${connected ? 'online' : ''}`}>
          <i />
          {connected ? 'Live connection' : 'Connecting'}
        </span>

        {/* Live IST Clock (Mumbai Time Zone) */}
        <span className="date">
          {now.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}{' '}
          ·{' '}
          {now.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })}{' '}
          IST
        </span>
      </div>
    </header>
  );
};
