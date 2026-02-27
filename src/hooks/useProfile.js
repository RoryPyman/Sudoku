import { useState, useRef, useCallback } from 'react';
import { friendsApi } from '../api/friends.js';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const cache = useRef(new Map());

  const fetchProfile = useCallback(async (username) => {
    if (!username) return;

    if (cache.current.has(username)) {
      setProfile(cache.current.get(username));
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      const data = await friendsApi.getProfile(username);
      cache.current.set(username, data);
      setProfile(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load profile';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, fetchProfile };
}
