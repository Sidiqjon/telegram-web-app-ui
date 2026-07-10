import { create } from 'zustand';
import { conversationsService } from '../services/conversations.service';
import { messagesService } from '../services/messages.service';
import { socketService } from '../services/socket.service';
import { useAuthStore } from './authStore';
import { Conversation } from '../types/conversation.types';
import { Message, MessageStatusEntry } from '../types/message.types';
import { PublicUser } from '../types/user.types';

interface PresenceInfo {
  isOnline: boolean;
  lastSeen?: string;
}

interface PaginationInfo {
  nextCursor: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  /** A user selected from search who we haven't actually messaged yet — no
   *  conversation exists in the DB until the first message is sent. */
  draftParticipant: PublicUser | null;
  messages: Record<string, Message[]>; // conversationId -> messages, oldest first
  pagination: Record<string, PaginationInfo>;
  typingUsers: Record<string, string[]>; // conversationId -> userIds currently typing
  presence: Record<string, PresenceInfo>; // userId -> presence
  unreadCounts: Record<string, number>;
  messageIndex: Record<string, string>; // messageId -> conversationId, for status lookups
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  listenersBound: boolean;

  loadConversations: () => Promise<void>;
  openConversation: (conversationId: string) => Promise<void>;
  closeActiveConversation: () => void;
  startConversationWithUser: (participant: PublicUser) => Promise<Conversation>;
  /** Opens a chat pane for a searched user WITHOUT creating a conversation yet. */
  openDraftConversation: (participant: PublicUser) => void;
  /** Used by the composer when there's no real conversation yet: creates it
   *  on first send, then sends the message. */
  sendTextToParticipant: (participant: PublicUser, text: string) => Promise<void>;
  sendFileToParticipant: (participant: PublicUser, file: File, type: 'IMAGE' | 'FILE') => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  sendText: (conversationId: string, text: string) => Promise<void>;
  sendFile: (conversationId: string, file: File, type: 'IMAGE' | 'FILE') => Promise<void>;
  editMessage: (messageId: string, text: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  bindSocketListeners: () => void;
  unbindSocketListeners: () => void;
  reset: () => void;
}

function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aTime = new Date(a.lastMessage?.createdAt ?? a.updatedAt).getTime();
    const bTime = new Date(b.lastMessage?.createdAt ?? b.updatedAt).getTime();
    return bTime - aTime;
  });
}

function currentUserId(): string | undefined {
  return useAuthStore.getState().user?.id;
}

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  draftParticipant: null,
  messages: {},
  pagination: {},
  typingUsers: {},
  presence: {},
  unreadCounts: {},
  messageIndex: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  listenersBound: false,

  loadConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const conversations = await conversationsService.list();
      set({ conversations: sortConversations(conversations), isLoadingConversations: false });
      // Join every conversation room so realtime messages arrive even when
      // that specific chat isn't the one currently open.
      conversations.forEach((c) => socketService.emit('joinConversation', { conversationId: c.id }));
    } catch (error) {
      set({ isLoadingConversations: false });
      throw error;
    }
  },

  openConversation: async (conversationId) => {
    set({
      activeConversationId: conversationId,
      draftParticipant: null,
      unreadCounts: { ...get().unreadCounts, [conversationId]: 0 },
    });
    socketService.emit('joinConversation', { conversationId });

    if (!get().messages[conversationId]) {
      set({ isLoadingMessages: true });
      try {
        const { messages, nextCursor } = await messagesService.getHistory(conversationId);
        const ascending = [...messages].reverse();
        const index: Record<string, string> = {};
        ascending.forEach((m) => (index[m.id] = conversationId));

        set((state) => ({
          messages: { ...state.messages, [conversationId]: ascending },
          pagination: {
            ...state.pagination,
            [conversationId]: { nextCursor, hasMore: !!nextCursor, isLoadingMore: false },
          },
          messageIndex: { ...state.messageIndex, ...index },
          isLoadingMessages: false,
        }));
      } catch (error) {
        set({ isLoadingMessages: false });
        throw error;
      }
    }

    // Best-effort read receipts: mark persisted read state, and emit a
    // per-message socket event so the sender gets a realtime blue tick.
    const myId = currentUserId();
    const unreadFromOthers = (get().messages[conversationId] ?? []).filter(
      (m) => m.senderId !== myId && !m.deletedAt,
    );
    unreadFromOthers.forEach((m) => socketService.emit('messageRead', { messageId: m.id }));
    messagesService.markRead(conversationId).catch(() => {});
  },

  closeActiveConversation: () => set({ activeConversationId: null, draftParticipant: null }),

  openDraftConversation: (participant) => {
    set({ activeConversationId: null, draftParticipant: participant });
  },

  startConversationWithUser: async (participant) => {
    const conversation = await conversationsService.findOrCreate(participant.id);
    socketService.emit('joinConversation', { conversationId: conversation.id });
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      const next = exists
        ? state.conversations.map((c) => (c.id === conversation.id ? conversation : c))
        : [conversation, ...state.conversations];
      return { conversations: sortConversations(next) };
    });
    return conversation;
  },

  sendTextToParticipant: async (participant, text) => {
    const conversation = await get().startConversationWithUser(participant);
    set({ activeConversationId: conversation.id, draftParticipant: null });
    await get().sendText(conversation.id, text);
  },

  sendFileToParticipant: async (participant, file, type) => {
    const conversation = await get().startConversationWithUser(participant);
    set({ activeConversationId: conversation.id, draftParticipant: null });
    await get().sendFile(conversation.id, file, type);
  },

  loadMoreMessages: async (conversationId) => {
    const pageInfo = get().pagination[conversationId];
    if (!pageInfo?.hasMore || pageInfo.isLoadingMore) return;

    set((state) => ({
      pagination: {
        ...state.pagination,
        [conversationId]: { ...pageInfo, isLoadingMore: true },
      },
    }));

    const { messages: olderPage, nextCursor } = await messagesService.getHistory(
      conversationId,
      pageInfo.nextCursor ?? undefined,
    );
    const olderAscending = [...olderPage].reverse();
    const index: Record<string, string> = {};
    olderAscending.forEach((m) => (index[m.id] = conversationId));

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...olderAscending, ...(state.messages[conversationId] ?? [])],
      },
      pagination: {
        ...state.pagination,
        [conversationId]: { nextCursor, hasMore: !!nextCursor, isLoadingMore: false },
      },
      messageIndex: { ...state.messageIndex, ...index },
    }));
  },

  sendText: async (conversationId, text) => {
    const myId = currentUserId();
    if (!myId) return;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Message = {
      id: tempId,
      clientTempId: tempId,
      conversationId,
      senderId: myId,
      text,
      fileUrl: null,
      type: 'TEXT',
      editedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSending: true,
      statuses: [],
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), optimistic],
      },
    }));

    try {
      const saved = await messagesService.sendText(conversationId, text);
      applyIncomingMessage(set, get, saved);
    } catch (error) {
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] ?? []).filter((m) => m.id !== tempId),
        },
      }));
      throw error;
    }
  },

  sendFile: async (conversationId, file, type) => {
    const saved = await messagesService.sendFile(conversationId, file, type);
    applyIncomingMessage(set, get, saved);
  },

  editMessage: async (messageId, text) => {
    const updated = await messagesService.edit(messageId, text);
    applyIncomingMessage(set, get, updated);
  },

  deleteMessage: async (messageId) => {
    const updated = await messagesService.remove(messageId);
    applyIncomingMessage(set, get, updated);
  },

  setTyping: (conversationId, isTyping) => {
    socketService.emit(isTyping ? 'typing' : 'stopTyping', { conversationId });
    if (isTyping) {
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socketService.emit('stopTyping', { conversationId });
      }, 3000);
    }
  },

  bindSocketListeners: () => {
    if (get().listenersBound) return;

    socketService.on('newMessage', (message: Message) => {
      applyIncomingMessage(set, get, message);
      const myId = currentUserId();
      if (message.senderId !== myId) {
        socketService.emit('messageDelivered', { messageId: message.id });
      }
    });

    socketService.on('messageUpdated', (message: Message) => {
      applyIncomingMessage(set, get, message);
    });

    socketService.on('messageDeleted', (message: Message) => {
      applyIncomingMessage(set, get, message);
    });

    socketService.on('messageStatusUpdate', (entry: MessageStatusEntry) => {
      const conversationId = get().messageIndex[entry.messageId];
      if (!conversationId) return;
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] ?? []).map((m) => {
            if (m.id !== entry.messageId) return m;
            const otherStatuses = (m.statuses ?? []).filter((s) => s.userId !== entry.userId);
            return { ...m, statuses: [...otherStatuses, entry] };
          }),
        },
      }));
    });

    socketService.on('typing', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      set((state) => {
        const current = state.typingUsers[conversationId] ?? [];
        if (current.includes(userId)) return state;
        return { typingUsers: { ...state.typingUsers, [conversationId]: [...current, userId] } };
      });
    });

    socketService.on('stopTyping', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: (state.typingUsers[conversationId] ?? []).filter((id) => id !== userId),
        },
      }));
    });

    socketService.on(
      'userStatus',
      ({ userId, isOnline, lastSeen }: { userId: string; isOnline: boolean; lastSeen?: string }) => {
        set((state) => ({ presence: { ...state.presence, [userId]: { isOnline, lastSeen } } }));
      },
    );

    set({ listenersBound: true });
  },

  unbindSocketListeners: () => {
    ['newMessage', 'messageUpdated', 'messageDeleted', 'messageStatusUpdate', 'typing', 'stopTyping', 'userStatus'].forEach(
      (event) => socketService.off(event),
    );
    set({ listenersBound: false });
  },

  reset: () =>
    set({
      conversations: [],
      activeConversationId: null,
      draftParticipant: null,
      messages: {},
      pagination: {},
      typingUsers: {},
      presence: {},
      unreadCounts: {},
      messageIndex: {},
    }),
}));

/**
 * Shared upsert logic used by REST responses (create/edit/delete) and every
 * relevant socket event. Handles: brand-new message, reconciling an optimistic
 * "sending" bubble, and updating an existing message in place (edit/delete).
 */
function applyIncomingMessage(
  set: (fn: (state: ChatState) => Partial<ChatState>) => void,
  get: () => ChatState,
  message: Message,
) {
  const conversationId = message.conversationId;
  const existingList = get().messages[conversationId];

  set((state) => {
    const conversations = state.conversations.some((c) => c.id === conversationId)
      ? state.conversations.map((c) =>
          c.id === conversationId ? { ...c, lastMessage: message, updatedAt: message.updatedAt } : c,
        )
      : state.conversations;

    const isActive = state.activeConversationId === conversationId;
    const myId = currentUserId();
    const shouldBumpUnread =
      !isActive &&
      message.senderId !== myId &&
      !message.deletedAt &&
      !existingList?.some((m) => m.id === message.id);

    if (!existingList) {
      // Conversation history not loaded yet (e.g. chat list preview only) — just
      // update the conversation preview; the message will load when opened.
      return {
        conversations: sortConversations(conversations),
        unreadCounts: shouldBumpUnread
          ? { ...state.unreadCounts, [conversationId]: (state.unreadCounts[conversationId] ?? 0) + 1 }
          : state.unreadCounts,
      };
    }

    const byIdIdx = existingList.findIndex((m) => m.id === message.id);
    let nextList: Message[];

    if (byIdIdx !== -1) {
      nextList = existingList.map((m) => (m.id === message.id ? { ...m, ...message } : m));
    } else {
      const optimisticIdx = existingList.findIndex(
        (m) => m.isSending && m.senderId === message.senderId && m.text === message.text && m.type === message.type,
      );
      if (optimisticIdx !== -1) {
        nextList = [...existingList];
        nextList[optimisticIdx] = message;
      } else {
        nextList = [...existingList, message];
      }
    }

    return {
      messages: { ...state.messages, [conversationId]: nextList },
      messageIndex: { ...state.messageIndex, [message.id]: conversationId },
      conversations: sortConversations(conversations),
      unreadCounts: shouldBumpUnread
        ? { ...state.unreadCounts, [conversationId]: (state.unreadCounts[conversationId] ?? 0) + 1 }
        : state.unreadCounts,
    };
  });
}