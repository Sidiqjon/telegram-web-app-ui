import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { EmptyState } from '../chat/EmptyState';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { tokenStorage } from '../../utils/tokenStorage';
import { socketService } from '../../services/socket.service';

export function AppLayout() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const bindSocketListeners = useChatStore((s) => s.bindSocketListeners);
  const unbindSocketListeners = useChatStore((s) => s.unbindSocketListeners);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) socketService.connect(accessToken);

    bindSocketListeners();
    loadConversations();

    return () => {
      unbindSocketListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-muted">
      <div className={`w-full shrink-0 flex-col border-r border-surface-border bg-white md:flex md:w-[380px] ${
        activeConversationId ? 'hidden' : 'flex'
      }`}>
        <Sidebar />
      </div>

      <div className={`min-w-0 flex-1 flex-col ${activeConversationId ? 'flex' : 'hidden md:flex'}`}>
        {activeConversationId ? <ChatWindow conversationId={activeConversationId} /> : <EmptyState />}
      </div>
    </div>
  );
}
