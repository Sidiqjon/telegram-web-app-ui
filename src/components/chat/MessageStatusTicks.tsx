import { Message } from '../../types/message.types';

function SingleTick({ className }: { className: string }) {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className={className}>
      <path d="M1 5.5 5 9.5 15 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DoubleTick({ className }: { className: string }) {
  return (
    <svg width="20" height="11" viewBox="0 0 20 11" fill="none" className={className}>
      <path d="M1 5.5 5 9.5 15 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 5.5 10 9.5 19 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MessageStatusTicks({ message, recipientId }: { message: Message; recipientId?: string }) {
  if (message.isSending) {
    return <Spinner />;
  }

  const status = message.statuses?.find((s) => s.userId === recipientId)?.status ?? 'SENT';

  if (status === 'READ') return <DoubleTick className="text-sky-400" />;
  if (status === 'DELIVERED') return <DoubleTick className="text-white/70" />;
  return <SingleTick className="text-white/70" />;
}

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-spin text-white/70">
      <circle className="opacity-30" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3z" />
    </svg>
  );
}
