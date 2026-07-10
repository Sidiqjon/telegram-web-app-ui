import { Avatar } from '../common/Avatar';
import { formatLastSeen } from '../../utils/formatTime';

interface ContactInfoData {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  phoneNumber?: string;
}

interface ContactInfoPanelProps {
  participant: ContactInfoData;
  isOnline?: boolean;
  lastSeen?: string;
  onBack: () => void;
}

export function ContactInfoPanel({ participant, isOnline, lastSeen, onBack }: ContactInfoPanelProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-surface-border px-3 py-2.5 sm:px-4">
        <button
          onClick={onBack}
          aria-label="Back to chat"
          className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-muted"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-ink">Contact info</span>
      </header>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-3 border-b border-surface-border bg-surface-muted px-6 py-8">
          <Avatar
            src={participant.avatarUrl}
            name={participant.fullName}
            size="xl"
            showOnlineDot={isOnline !== undefined}
            isOnline={isOnline}
          />
          <div className="text-center">
            <p className="text-lg font-semibold text-ink">{participant.fullName}</p>
            <p className="text-sm text-ink-faint">
              {isOnline ? 'online' : lastSeen ? formatLastSeen(lastSeen) : `@${participant.username}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1 py-2">
          <InfoRow label="Username" value={`@${participant.username}`} />
          {participant.phoneNumber && <InfoRow label="Phone number" value={participant.phoneNumber} />}
          {participant.bio && <InfoRow label="Bio" value={participant.bio} />}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink">{value}</p>
    </div>
  );
}