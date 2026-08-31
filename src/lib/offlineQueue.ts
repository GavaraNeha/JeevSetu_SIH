import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Severity } from '@/types/db';

export interface QueuedReport {
  id: string;
  data: {
    animal_id: string | null;
    reporter_id: string;
    species: string;
    breed: string | null;
    symptoms: string[];
    notes: string | null;
    photo_url: string | null;
    latitude: number | null;
    longitude: number | null;
    village: string | null;
    block: string | null;
    district: string | null;
    state: string | null;
    severity: Severity;
    triage_recommendation: string;
    vet_referral_needed: boolean;
    status: 'triaged';
  };
  queuedAt: number;
  synced: boolean;
}

const QUEUE_KEY = 'jeevsetu_offline_queue';

function readQueue(): QueuedReport[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedReport[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedReport[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event('jeevsetu_queue_changed'));
}

export function enqueueReport(data: QueuedReport['data']): QueuedReport {
  const report: QueuedReport = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    data,
    queuedAt: Date.now(),
    synced: false,
  };
  const queue = readQueue();
  queue.push(report);
  writeQueue(queue);
  return report;
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = readQueue();
  const unsynced = queue.filter((r) => !r.synced);
  if (unsynced.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const report of unsynced) {
    const { error } = await supabase.from('reports').insert(report.data);
    if (error) {
      failed++;
    } else {
      report.synced = true;
      synced++;
    }
  }

  const remaining = queue.filter((r) => !r.synced);
  writeQueue(remaining);
  return { synced, failed };
}

export function useOfflineQueue() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queue, setQueue] = useState<QueuedReport[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refreshQueue = useCallback(() => {
    setQueue(readQueue());
  }, []);

  useEffect(() => {
    refreshQueue();

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleQueueChange = () => refreshQueue();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('jeevsetu_queue_changed', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('jeevsetu_queue_changed', handleQueueChange);
    };
  }, [refreshQueue]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (online) {
      const pending = readQueue().filter((r) => !r.synced);
      if (pending.length > 0) {
        setSyncing(true);
        syncQueue().finally(() => {
          setSyncing(false);
          refreshQueue();
        });
      }
    }
  }, [online, refreshQueue]);

  const pendingCount = queue.filter((r) => !r.synced).length;

  return { online, queue, pendingCount, syncing, enqueueReport, syncQueue, refreshQueue };
}
