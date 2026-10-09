import { useEffect, useMemo, useState } from 'react';
import { Trade, PullJob, WebSocketEvent } from '../types/trade';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/trades';

/**
 * Custom React Hook to manage Trade Dashboard state,
 * WebSocket subscription, REST API calls, and live IST clock.
 */
export function useTradeDashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [job, setJob] = useState<PullJob | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [now, setNow] = useState<Date>(new Date());

  // 1. Ticking Live IST Clock (updates every second)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Setup WebSocket connection & initial REST API fetch
  useEffect(() => {
    let alive = true;
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => alive && setConnected(true);
    socket.onclose = () => alive && setConnected(false);
    socket.onerror = () => alive && setConnected(false);

    // Handle incoming real-time server push events over WebSocket
    socket.onmessage = (message) => {
      if (!alive) return;
      try {
        const event: WebSocketEvent = JSON.parse(message.data);

        if (event.type === 'TRADES_ADDED') {
          const incoming = event.data as Trade[];
          setTrades((old) => {
            const known = new Set(old.map((x) => x.tradeId));
            return [...incoming.filter((x) => !known.has(x.tradeId)), ...old].slice(0, 500);
          });
          setTotal((n) => n + incoming.length);
        } else if (
          ['PULL_STARTED', 'PULL_STATUS', 'PULL_COMPLETED', 'PULL_FAILED'].includes(event.type)
        ) {
          setJob(event.data);
          if (event.type === 'PULL_COMPLETED') setError('');
          if (event.type === 'PULL_FAILED') setError(event.data.error || 'Pull failed');
        } else if (event.type === 'PULL_CANCELLED') {
          setJob(null);
        }
      } catch {
        setError('Received an unreadable server event');
      }
    };

    // Fetch persisted trades on load
    fetch(`${API_BASE_URL}/api/trades?limit=500`)
      .then((r) => {
        if (!r.ok) throw new Error('Could not load trades');
        return r.json();
      })
      .then((d) => {
        if (alive) {
          setTrades(d.trades);
          setTotal(d.total);
          setError('');
        }
      })
      .catch((e) => {
        if (alive) {
          const msg = e.message === 'Failed to fetch' 
            ? 'Failed to fetch: Cannot connect to backend server at http://localhost:8000. Please start the backend server.' 
            : e.message;
          setError(msg);
        }
      });

    // Fetch recent pull job status on load
    fetch(`${API_BASE_URL}/api/pulls`)
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.jobs?.length) {
          const activeJob = d.jobs.find((x: PullJob) => x.status === 'RUNNING' || x.status === 'PENDING');
          if (activeJob) {
            setJob(activeJob);
          } else {
            setJob(d.jobs[0]);
          }
        }
      })
      .catch(() => {});

    return () => {
      alive = false;
      socket.close();
    };
  }, []);

  // 3. Trigger new background trade pull (HTTP POST 202)
  async function startPull() {
    setStarting(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/pulls`, { method: 'POST' });
      if (!response.ok) throw new Error('Unable to start trade pull');
      const data: PullJob = await response.json();
      setJob(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start trade pull');
    } finally {
      setStarting(false);
    }
  }

  // 4. Remove / Cancel active pull job
  async function cancelPull() {
    if (!job) return;
    const targetId = job.jobId;
    setJob(null);
    try {
      await fetch(`${API_BASE_URL}/api/pulls/${targetId}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  }

  // 5. Client-side search filtering
  const shownTrades = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? trades.filter((t) =>
          [t.tradeId, t.client, t.symbol].some((v) => v.toLowerCase().includes(q))
        )
      : trades;
  }, [trades, query]);

  const isRunning = job?.status === 'RUNNING' || job?.status === 'PENDING';

  return {
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
  };
}
