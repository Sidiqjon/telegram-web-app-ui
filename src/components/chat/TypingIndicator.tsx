export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="mr-auto flex items-center gap-1.5 rounded-bubble rounded-bl-md border border-surface-border bg-white px-3.5 py-2.5 shadow-sm">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-faint" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-faint" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-faint" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="sr-only">{name} is typing…</span>
    </div>
  );
}
