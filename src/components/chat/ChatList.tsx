import { useChatStore } from '../../store/chatStore';
import { Avatar } from '../common/Avatar';
import { Spinner } from '../common/Spinner';
import { formatConversationTimestamp } from '../../utils/formatTime';

export function ChatList({ onOpenSearch }: { onOpenSearch: () => void }) {
  const conversations = useChatStore((s) => s.conversations);
  const isLoading = useChatStore((s) => s.isLoadingConversations);
  const openConversation = useChatStore((s) => s.openConversation);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const presence = useChatStore((s) => s.presence);
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const typingUsers = useChatStore((s) => s.typingUsers);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-brand-600">
        <Spinner size={24} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-ink">No conversations yet</p>
        <p className="text-sm text-ink-faint">Search for a username to start your first chat.</p>
        <button
          onClick={onOpenSearch}
          className="mt-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Find people
        </button>
      </div>
    );
  }

  return (
    <div className="thin-scrollbar h-full overflow-y-auto">
      {conversations.map((c) => {
        const isActive = c.id === activeConversationId;
        const isOnline = presence[c.participant.id]?.isOnline ?? c.participant.isOnline ?? false;
        const isTyping = (typingUsers[c.id] ?? []).includes(c.participant.id);
        const unread = unreadCounts[c.id] ?? 0;

        let preview = 'Say hello 👋';
        if (isTyping) {
          preview = 'typing…';
        } else if (c.lastMessage) {
          if (c.lastMessage.deletedAt) preview = 'Message deleted';
          else if (c.lastMessage.type === 'TEXT') preview = c.lastMessage.text ?? '';
          else if (c.lastMessage.type === 'IMAGE') preview = '📷 Photo';
          else preview = '📎 File';
        }

        return (
          <button
            key={c.id}
            onClick={() => openConversation(c.id)}
            className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
              isActive ? 'border-brand-600 bg-brand-50' : 'border-transparent hover:bg-surface-muted'
            }`}
          >
            <Avatar src={c.participant.avatarUrl} name={c.participant.fullName} showOnlineDot isOnline={isOnline} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink">{c.participant.fullName}</span>
                {c.lastMessage && (
                  <span className="shrink-0 text-xs text-ink-faint">
                    {formatConversationTimestamp(c.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-sm ${isTyping ? 'font-medium text-brand-600' : 'text-ink-faint'}`}>
                  {preview}
                </span>
                {unread > 0 && (
                  <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                    {unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
