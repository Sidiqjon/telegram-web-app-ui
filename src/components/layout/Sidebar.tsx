import { useState } from 'react';
import { ChatList } from '../chat/ChatList';
import { UserSearchPanel } from '../search/UserSearchPanel';
import { ProfilePanel } from '../profile/ProfilePanel';
import { Avatar } from '../common/Avatar';
import { useAuthStore } from '../../store/authStore';
import chatlyIcon from '../../assets/chatly.webp';

type SidebarTab = 'chats' | 'search' | 'profile';

const TABS: { id: SidebarTab; label: string; icon: JSX.Element }[] = [
  {
    id: 'chats',
    label: 'Chats',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const [tab, setTab] = useState<SidebarTab>('chats');
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <img src={chatlyIcon} alt="Ch" className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight text-ink">Chatly</span>
        </div>
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-label={t.label}
              className={`rounded-lg p-2 transition-colors ${
                tab === t.id ? 'bg-brand-50 text-brand-600' : 'text-ink-faint hover:bg-surface-muted hover:text-ink-soft'
              }`}
            >
              {t.icon}
            </button>
          ))}
          <button
            onClick={() => setTab('profile')}
            aria-label="Profile"
            className={`ml-1 rounded-full transition-opacity ${tab === 'profile' ? 'ring-2 ring-brand-500' : 'opacity-90 hover:opacity-100'}`}
          >
            {user && <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {tab === 'chats' && <ChatList onOpenSearch={() => setTab('search')} />}
        {tab === 'search' && <UserSearchPanel onOpenedChat={() => setTab('chats')} />}
        {tab === 'profile' && <ProfilePanel />}
      </div>
    </div>
  );
}