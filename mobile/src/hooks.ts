import { useAuth } from "@clerk/expo";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/src/services/api";

export function useApi<T>(path: string, init?: RequestInit) {
  const { getToken } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const getTokenRef = useRef(getToken);
  const initRef = useRef(init);
  getTokenRef.current = getToken;
  initRef.current = init;
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await apiRequest<T>(path, { ...initRef.current, token: await getTokenRef.current() })); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load data."); }
    finally { setLoading(false); }
  }, [path]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh, getToken };
}
