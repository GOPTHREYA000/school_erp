"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export function useApi<T>(url: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url);
      // Backend wraps responses as { success: true, data: <payload> }
      // Unwrap automatically; fall back to raw data for non-wrapped endpoints
      const payload = res.data?.data !== undefined ? res.data.data : res.data;
      setData(payload);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [url, ...deps]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
