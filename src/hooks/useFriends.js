import { useState, useCallback, useEffect, useRef } from 'react';
import { friendsApi } from '../api/friends.js';

export function useFriends() {
  const [friends, setFriends]       = useState([]);
  const [received, setReceived]     = useState([]);
  const [sent, setSent]             = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading]       = useState(true);

  // ── Initial fetch ──────────────────────────────────────────

  const refresh = useCallback(async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        friendsApi.list(),
        friendsApi.requests(),
      ]);
      setFriends(friendsData.friends);
      setReceived(requestsData.received);
      setSent(requestsData.sent);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Search ─────────────────────────────────────────────────

  const searchTimerRef = useRef(null);

  const search = useCallback((query) => {
    clearTimeout(searchTimerRef.current);
    if (!query || query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const { users } = await friendsApi.search(query);
        setSearchResults(users);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  // ── Actions with optimistic updates ────────────────────────

  const sendRequest = useCallback(async (user) => {
    // Optimistic: update search results
    setSearchResults(prev =>
      prev.map(u => u.userId === user.userId ? { ...u, relationshipStatus: 'request_sent' } : u)
    );
    setSent(prev => [...prev, user]);
    try {
      await friendsApi.sendRequest(user.userId);
    } catch {
      // Rollback
      setSearchResults(prev =>
        prev.map(u => u.userId === user.userId ? { ...u, relationshipStatus: 'none' } : u)
      );
      setSent(prev => prev.filter(u => u.userId !== user.userId));
    }
  }, []);

  const acceptRequest = useCallback(async (user) => {
    setReceived(prev => prev.filter(u => u.userId !== user.userId));
    setFriends(prev => [...prev, user]);
    setSearchResults(prev =>
      prev.map(u => u.userId === user.userId ? { ...u, relationshipStatus: 'friends' } : u)
    );
    try {
      await friendsApi.acceptRequest(user.userId);
    } catch {
      refresh();
    }
  }, [refresh]);

  const declineRequest = useCallback(async (user) => {
    setReceived(prev => prev.filter(u => u.userId !== user.userId));
    setSearchResults(prev =>
      prev.map(u => u.userId === user.userId ? { ...u, relationshipStatus: 'none' } : u)
    );
    try {
      await friendsApi.declineRequest(user.userId);
    } catch {
      refresh();
    }
  }, [refresh]);

  const removeFriend = useCallback(async (user) => {
    setFriends(prev => prev.filter(u => u.userId !== user.userId));
    setSearchResults(prev =>
      prev.map(u => u.userId === user.userId ? { ...u, relationshipStatus: 'none' } : u)
    );
    try {
      await friendsApi.removeFriend(user.userId);
    } catch {
      refresh();
    }
  }, [refresh]);

  const cancelRequest = useCallback(async (user) => {
    setSent(prev => prev.filter(u => u.userId !== user.userId));
    setSearchResults(prev =>
      prev.map(u => u.userId === user.userId ? { ...u, relationshipStatus: 'none' } : u)
    );
    try {
      await friendsApi.cancelRequest(user.userId);
    } catch {
      refresh();
    }
  }, [refresh]);

  return {
    friends, received, sent,
    searchResults, searchLoading, search,
    loading, refresh,
    sendRequest, acceptRequest, declineRequest, removeFriend, cancelRequest,
    receivedCount: received.length,
  };
}
