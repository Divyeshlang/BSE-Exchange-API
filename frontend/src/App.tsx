import { ArrowDownToLine, CircleAlert } from 'lucide-react';
import { useTradeDashboard } from './hooks/useTradeDashboard';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { PullStatusBanner } from './components/PullStatusBanner';
import { TradeTable } from './components/TradeTable';

/**
 * Main BSE Trade Dashboard Application Container Component.
 * Composes modular UI components and hooks into an industry-grade layout.
 */
export default function App() {
  const {
    trades,
    total,
    job,
    connected,
    starting,
    error,
    query,
    setQuery,
    now,
    startPull,
    cancelPull,
    shownTrades,
    isRunning,
  } = useTradeDashboard();

  return (
    <main className="page">
      {/* Top Navigation Bar & Live IST Clock */}
      <Header connected={connected} now={now} />

      {/* Intro Header & Trigger Button */}
      <section className="intro">
        <div>
          <div className="eyebrow">
            MARKET OPERATIONS <span> / </span> OVERVIEW
          </div>
          <h1>Trade dashboard</h1>
          <p>Monitor exchange trade activity and pull status in real time.</p>
        </div>

        <button
          className="primary"
          onClick={startPull}
          disabled={starting || isRunning}
        >
          <ArrowDownToLine size={17} />
          {starting
            ? 'Starting…'
            : isRunning
              ? 'Pull in progress'
              : 'Start trade pull'}
        </button>
      </section>

      {/* Error Alert Message */}
      {error && (
        <div className="error">
          <CircleAlert size={17} />
          {error}
        </div>
      )}

      {/* Metric Summary Cards */}
      <SummaryCards
        total={total}
        job={job}
        isRunning={isRunning}
        latestTrade={trades[0]}
      />

      {/* Active Pull Job Progress Banner */}
      {job && <PullStatusBanner job={job} isRunning={isRunning} onCancel={cancelPull} />}

      {/* Real-time Trades Table */}
      <TradeTable
        trades={shownTrades}
        total={total}
        query={query}
        onSearchChange={setQuery}
      />

      {/* Page Footer */}
      <div className="footnote">
        BSE TRADE DATA · LOCAL DEMONSTRATION ENVIRONMENT
      </div>
    </main>
  );
}
