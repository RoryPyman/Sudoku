import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { feedApi } from '../api/feed.js';
import FeedItem from '../components/FeedItem.jsx';

export default function FeedPage() {
  const [items,       setItems]       = useState([]);
  const [nextCursor,  setNextCursor]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    feedApi.get({ limit: 20 })
      .then(({ items: data, nextCursor: cursor }) => {
        setItems(data);
        setNextCursor(cursor);
      })
      .catch(() => setError('Failed to load feed'))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items: data, nextCursor: cursor } = await feedApi.get({
        before: nextCursor,
        limit: 20,
      });
      setItems(prev => [...prev, ...data]);
      setNextCursor(cursor);
    } catch {
      // Silently fail on load-more — user can retry
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-2.75rem)] bg-bg flex items-center justify-center">
        <span className="text-text-muted text-sm">Loading feed...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100dvh-2.75rem)] bg-bg flex items-center justify-center">
        <span className="text-cell-conflict text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-2.75rem)] bg-bg px-4 py-8">
      <div className="max-w-[600px] mx-auto flex flex-col gap-5">

        <h2 className="font-title text-[1.6rem] font-bold text-accent">Friend Activity</h2>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-text-muted text-[.85rem]">
              No friend activity yet.
            </p>
            <p className="text-text-dim text-[.78rem]">
              Add friends to see their puzzles, challenges, and milestones here.
            </p>
            <Link to="/friends" className="ctrl-btn ctrl-btn-accent text-[.8rem] mt-2">
              Find Friends
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {items.map((item, i) => (
                <FeedItem key={`${item.type}-${item._id}-${i}`} item={item} />
              ))}
            </div>

            {nextCursor && (
              <button
                className="ctrl-btn mx-auto text-[.8rem]"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
