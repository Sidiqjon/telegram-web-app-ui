export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface-muted px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-500 shadow-panel">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-base font-semibold text-ink">Select a conversation</p>
      <p className="max-w-xs text-sm text-ink-faint">
        Pick a chat from the list, or search for a username to start a new one.
      </p>
    </div>
  );
}
