import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ContactInfoPanel } from './ContactInfoPanel';
import { Avatar } from '../common/Avatar';
import { Spinner } from '../common/Spinner';
import { formatDaySeparator, formatLastSeen } from '../../utils/formatTime';
import { PublicUser } from '../../types/user.types';
import { ConversationParticipant } from '../../types/conversation.types';

const SCROLL_BOTTOM_THRESHOLD = 120;
const LOAD_MORE_THRESHOLD = 80;

function getFallbackPresence(
  participant: ConversationParticipant | PublicUser,
): { isOnline?: boolean; lastSeen?: string } {
  if ('isOnline' in participant) {
    return { isOnline: participant.isOnline, lastSeen: participant.lastSeen };
  }
  return {};
}

interface ChatWindowProps {
  /** Set when viewing an existing conversation. */
  conversationId?: string;
  /** Set when this is a brand-new chat (picked from search, nothing sent yet). */
  draftParticipant?: PublicUser;
}

export function ChatWindow({ conversationId, draftParticipant }: ChatWindowProps) {
  const conversation = useChatStore((s) =>
    conversationId ? s.conversations.find((c) => c.id === conversationId) : undefined,
  );
  const messages = useChatStore((s) => (conversationId ? s.messages[conversationId] ?? [] : []));
  const pagination = useChatStore((s) => (conversationId ? s.pagination[conversationId] : undefined));
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const typingUsers = useChatStore((s) => (conversationId ? s.typingUsers[conversationId] ?? [] : []));
  const presence = useChatStore((s) => s.presence);
  const openConversation = useChatStore((s) => s.openConversation);
  const closeActiveConversation = useChatStore((s) => s.closeActiveConversation);
  const loadMoreMessages = useChatStore((s) => s.loadMoreMessages);
  const currentUser = useAuthStore((s) => s.user);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const prevMessageCountRef = useRef(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [view, setView] = useState<'chat' | 'contact'>('chat');

  useEffect(() => {
    if (conversationId) openConversation(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Auto-scroll to bottom on first load of a conversation, or when a new
  // message arrives while the user is already near the bottom of the thread.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isFirstRenderOfThisList = prevMessageCountRef.current === 0 && messages.length > 0;
    const messageWasAppended = messages.length > prevMessageCountRef.current;

    if (isFirstRenderOfThisList || (messageWasAppended && isNearBottom)) {
      el.scrollTop = el.scrollHeight;
    } else if (messages.length < prevMessageCountRef.current) {
      // Older messages were prepended (infinite scroll) — keep the viewport
      // anchored to where the user was reading, instead of jumping to top.
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current + el.scrollTop;
    }

    prevMessageCountRef.current = messages.length;
    prevScrollHeightRef.current = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Reset scroll tracking and contact-info view whenever we switch chats
  useEffect(() => {
    prevMessageCountRef.current = 0;
    prevScrollHeightRef.current = 0;
    setIsNearBottom(true);
    setView('chat');
  }, [conversationId, draftParticipant?.id]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || !conversationId) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(distanceFromBottom < SCROLL_BOTTOM_THRESHOLD);

    if (el.scrollTop < LOAD_MORE_THRESHOLD && pagination?.hasMore && !pagination.isLoadingMore) {
      prevScrollHeightRef.current = el.scrollHeight;
      loadMoreMessages(conversationId);
    }
  }

  // Resolve a single "participant" shape whether we're in a real conversation
  // or a draft (search result) chat that hasn't been created yet.
  const participant = conversation?.participant ?? draftParticipant;
  if (!participant) return null;

  const fallbackPresence = getFallbackPresence(participant);
  const participantPresence = presence[participant.id];
  const isOnline = participantPresence?.isOnline ?? fallbackPresence.isOnline ?? false;
  const lastSeenValue = participantPresence?.lastSeen ?? fallbackPresence.lastSeen;
  const isTyping = typingUsers.includes(participant.id);

  if (view === 'contact') {
    return (
      <ContactInfoPanel
        participant={participant}
        isOnline={isOnline}
        lastSeen={lastSeenValue}
        onBack={() => setView('chat')}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface-muted">
      <header className="flex shrink-0 items-center gap-3 border-b border-surface-border bg-white px-3 py-2.5 sm:px-4">
        <button
          onClick={closeActiveConversation}
          aria-label="Back to chat list"
          className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-muted md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={() => setView('contact')}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-0.5 text-left hover:bg-surface-muted"
          aria-label="View contact info"
        >
          <Avatar src={participant.avatarUrl} name={participant.fullName} showOnlineDot isOnline={isOnline} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{participant.fullName}</p>
            <p className="truncate text-xs text-ink-faint">
              {isTyping ? (
                <span className="font-medium text-brand-600">typing…</span>
              ) : isOnline ? (
                'online'
              ) : (
                formatLastSeen(lastSeenValue)
              )}
            </p>
          </div>
        </button>
      </header>

      <div ref={scrollRef} onScroll={handleScroll} className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        {pagination?.isLoadingMore && (
          <div className="mb-3 flex justify-center text-brand-500">
            <Spinner size={18} />
          </div>
        )}

        {conversationId && isLoadingMessages && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-brand-500">
            <Spinner size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-ink">Say hello 👋</p>
            <p className="text-sm text-ink-faint">Send a message to start chatting with {participant.fullName}.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {messages.map((message, idx) => {
              const prev = messages[idx - 1];
              const showDaySeparator = !prev || new Date(prev.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
              const showSender = !prev || prev.senderId !== message.senderId;
              const isOwn = message.senderId === currentUser?.id;

              return (
                <div key={message.id}>
                  {showDaySeparator && (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-faint shadow-sm">
                        {formatDaySeparator(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    recipientId={isOwn ? participant.id : undefined}
                    showSender={showSender}
                  />
                </div>
              );
            })}
            {isTyping && <TypingIndicator name={participant.fullName} />}
          </div>
        )}
      </div>

      <MessageInput conversationId={conversationId} draftParticipant={!conversationId ? draftParticipant : undefined} />
    </div>
  );
}