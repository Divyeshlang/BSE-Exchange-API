import React from 'react';
import { Search } from 'lucide-react';
import { Trade } from '../types/trade';

interface TradeTableProps {
  trades: Trade[];
  total: number;
  query: string;
  onSearchChange: (value: string) => void;
}

// Currency formatter for Indian Rupees (INR)
const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

// Date & Time formatter in Indian Standard Time (IST)
const formatTimeIST = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

/**
 * Trade Activity Table displaying real-time BSE trade records
 * with search filtering by Trade ID, Client Name, or Symbol.
 */
export const TradeTable: React.FC<TradeTableProps> = ({
  trades,
  total,
  query,
  onSearchChange,
}) => {
  return (
    <section className="table-card">
      <div className="table-heading">
        <div>
          <h2>Trade activity</h2>
          <p>Latest exchange records saved to your database</p>
        </div>

        {/* Real-time Search Input */}
        <label className="search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search trades (e.g. RELIANCE, Client 01)"
          />
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>TRADE ID</th>
              <th>CLIENT</th>
              <th>SYMBOL</th>
              <th>QUANTITY</th>
              <th>PRICE</th>
              <th>TIMESTAMP</th>
            </tr>
          </thead>
          <tbody>
            {trades.length ? (
              trades.map((t) => (
                <tr key={t.tradeId}>
                  <td className="trade-id">{t.tradeId}</td>
                  <td>{t.client}</td>
                  <td>
                    <span className="symbol">{t.symbol}</span>
                  </td>
                  <td>{t.quantity.toLocaleString('en-IN')}</td>
                  <td className="price">{moneyFormatter.format(t.price)}</td>
                  <td className="timestamp">{formatTimeIST(t.timestamp)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty">
                  {query
                    ? 'No matching trades found'
                    : 'No trades yet. Start a pull to load exchange data.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="table-foot">
        Showing {trades.length.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')} trades{' '}
        <span>Updates arrive over WebSocket in real time</span>
      </footer>
    </section>
  );
};
