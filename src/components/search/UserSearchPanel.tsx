import { useEffect, useState } from 'react';
import { usersService } from '../../services/users.service';
import { useChatStore } from '../../store/chatStore';
import { Avatar } from '../common/Avatar';
import { Spinner } from '../common/Spinner';
import { PublicUser } from '../../types/user.types';

export function UserSearchPanel({ onOpenedChat }: { onOpenedChat: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const startConversationWithUser = useChatStore((s) => s.startConversationWithUser);
  const openConversation = useChatStore((s) => s.openConversation);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const users = await usersService.search(trimmed);
        setResults(users);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  async function handleSelectUser(user: PublicUser) {
    setOpeningId(user.id);
    try {
      const conversation = await startConversationWithUser(user);
      await openConversation(conversation.id);
      onOpenedChat();
      setQuery('');
      setResults([]);
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-muted px-3 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-faint">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username…"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {isSearching && <Spinner size={14} className="text-brand-500" />}
        </div>
      </div>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {!query.trim() && (
          <p className="px-2 pt-6 text-center text-sm text-ink-faint">Find people by their username to start chatting.</p>
        )}
        {query.trim() && !isSearching && results.length === 0 && (
          <p className="px-2 pt-6 text-center text-sm text-ink-faint">No users found for "{query}"</p>
        )}
        {results.map((user) => (
          <button
            key={user.id}
            onClick={() => handleSelectUser(user)}
            disabled={openingId === user.id}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-surface-muted disabled:opacity-60"
          >
            <Avatar src={user.avatarUrl} name={user.fullName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
              <p className="truncate text-xs text-ink-faint">@{user.username}</p>
            </div>
            {openingId === user.id && <Spinner size={16} className="text-brand-500" />}
          </button>
        ))}
      </div>
    </div>
  );
}
