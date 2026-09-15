import { useAuth } from "@clerk/expo";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/src/services/api";

export function useApi<T>(path: string, init?: RequestInit) {
  const { getToken } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await apiRequest<T>(path, { ...init, token: await getToken() })); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load data."); }
    finally { setLoading(false); }
  }, [getToken, path]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh, getToken };
}
