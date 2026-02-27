import { useState } from 'react';
import { useFriends } from '../hooks/useFriends.js';
import { cn } from '../lib/cn.js';

const TABS = ['My Friends', 'Requests', 'Find Friends'];

function UserRow({ user, actions }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg-hover transition-colors">
      <div>
        <span className="text-sm text-text-primary font-medium">
          {user.firstName} {user.lastName}
        </span>
        <span className="text-[.75rem] text-text-muted ml-2">@{user.username}</span>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

export default function FriendsPage() {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);
  const f = useFriends();

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    f.search(val);
  };

  if (f.loading) {
    return (
      <div className="min-h-[calc(100dvh-2.75rem)] flex items-center justify-center">
        <span className="text-text-muted text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-2.75rem)] px-4 py-8">
      <div className="max-w-[600px] mx-auto">
        <h1 className="font-title text-[1.8rem] font-bold text-accent mb-6 text-center">Friends</h1>

        {/* Tab bar */}
        <div className="flex bg-bg-surface border border-border-cell rounded-lg overflow-hidden mb-6">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={cn(
                'flex-1 py-2 text-[.8rem] font-medium tracking-[.04em] transition-colors relative',
                i === tab ? 'bg-accent-dim text-accent' : 'text-text-muted hover:bg-bg-hover hover:text-text-primary',
              )}
              onClick={() => setTab(i)}
            >
              {t}
              {i === 1 && f.receivedCount > 0 && (
                <span className="absolute top-1 right-2 bg-accent text-bg text-[.6rem] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {f.receivedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* My Friends */}
        {tab === 0 && (
          <div className="flex flex-col gap-1">
            {f.friends.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">
                You haven't added any friends yet. Search to find people.
              </p>
            ) : (
              f.friends.map(u => (
                <UserRow
                  key={u.userId}
                  user={u}
                  actions={
                    confirmRemove === u.userId ? (
                      <>
                        <span className="text-[.72rem] text-text-muted">Remove?</span>
                        <button
                          className="ctrl-btn text-[.72rem] py-1 px-2 text-cell-conflict border-cell-conflict"
                          onClick={() => { f.removeFriend(u); setConfirmRemove(null); }}
                        >
                          Yes
                        </button>
                        <button
                          className="ctrl-btn text-[.72rem] py-1 px-2"
                          onClick={() => setConfirmRemove(null)}
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        className="ctrl-btn text-[.72rem] py-1 px-2"
                        onClick={() => setConfirmRemove(u.userId)}
                      >
                        Remove
                      </button>
                    )
                  }
                />
              ))
            )}
          </div>
        )}

        {/* Requests */}
        {tab === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-[.75rem] text-text-muted uppercase tracking-widest mb-2">Received</h3>
              {f.received.length === 0 ? (
                <p className="text-text-dim text-[.8rem] py-2">No pending requests</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {f.received.map(u => (
                    <UserRow
                      key={u.userId}
                      user={u}
                      actions={
                        <>
                          <button
                            className="ctrl-btn ctrl-btn-accent text-[.72rem] py-1 px-2"
                            onClick={() => f.acceptRequest(u)}
                          >
                            Accept
                          </button>
                          <button
                            className="ctrl-btn text-[.72rem] py-1 px-2"
                            onClick={() => f.declineRequest(u)}
                          >
                            Decline
                          </button>
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-[.75rem] text-text-muted uppercase tracking-widest mb-2">Sent</h3>
              {f.sent.length === 0 ? (
                <p className="text-text-dim text-[.8rem] py-2">No sent requests</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {f.sent.map(u => (
                    <UserRow
                      key={u.userId}
                      user={u}
                      actions={
                        <button
                          className="ctrl-btn text-[.72rem] py-1 px-2"
                          onClick={() => f.cancelRequest(u)}
                        >
                          Cancel
                        </button>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Find Friends */}
        {tab === 2 && (
          <div>
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Search by name or username..."
              className="w-full bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors duration-[120ms] mb-4"
            />

            {f.searchLoading ? (
              <div className="flex justify-center py-8">
                <span className="text-text-muted text-sm">Searching...</span>
              </div>
            ) : query.length >= 2 && f.searchResults.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">No users found</p>
            ) : (
              <div className="flex flex-col gap-1">
                {f.searchResults.map(u => (
                  <UserRow
                    key={u.userId}
                    user={u}
                    actions={
                      u.relationshipStatus === 'friends' ? (
                        <span className="text-[.72rem] text-text-dim">Friends</span>
                      ) : u.relationshipStatus === 'request_sent' ? (
                        <button
                          className="ctrl-btn text-[.72rem] py-1 px-2"
                          onClick={() => f.cancelRequest(u)}
                        >
                          Cancel Request
                        </button>
                      ) : u.relationshipStatus === 'request_received' ? (
                        <button
                          className="ctrl-btn ctrl-btn-accent text-[.72rem] py-1 px-2"
                          onClick={() => f.acceptRequest(u)}
                        >
                          Accept Request
                        </button>
                      ) : (
                        <button
                          className="ctrl-btn ctrl-btn-accent text-[.72rem] py-1 px-2"
                          onClick={() => f.sendRequest(u)}
                        >
                          Add Friend
                        </button>
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
