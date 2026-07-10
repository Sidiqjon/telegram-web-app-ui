import { useState } from 'react';
import { Message } from '../../types/message.types';
import { formatMessageTime } from '../../utils/formatTime';
import { MessageStatusTicks } from './MessageStatusTicks';
import { MediaViewerModal } from './MediaViewerModal';
import { useChatStore } from '../../store/chatStore';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  recipientId?: string;
  showSender: boolean;
}

function getFileNameFromUrl(url: string): string {
  try {
    const clean = url.split('?')[0];
    const parts = clean.split('/');
    return decodeURIComponent(parts[parts.length - 1]) || 'file';
  } catch {
    return 'file';
  }
}

export function MessageBubble({ message, isOwn, recipientId, showSender }: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [draft, setDraft] = useState(message.text ?? '');
  const editMessage = useChatStore((s) => s.editMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);

  const isDeleted = !!message.deletedAt;
  const canEdit = isOwn && message.type === 'TEXT' && !isDeleted && !message.isSending;
  const canDelete = isOwn && !isDeleted && !message.isSending;

  async function handleSaveEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.text) {
      await editMessage(message.id, trimmed);
    }
    setIsEditing(false);
  }

  async function handleDelete() {
    setMenuOpen(false);
    await deleteMessage(message.id);
  }

  const bubbleBase = 'max-w-[78%] sm:max-w-[65%] rounded-bubble px-3.5 py-2.5 text-sm leading-relaxed shadow-sm';
  const ownBubble = 'ml-auto rounded-br-md bg-brand-600 text-white';
  const otherBubble = 'mr-auto rounded-bl-md border border-surface-border bg-white text-ink';

  return (
    <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} px-1`}>
      <div className={`relative ${bubbleBase} ${isOwn ? ownBubble : otherBubble}`}>
        {showSender && !isOwn && message.sender && (
          <p className="mb-0.5 text-xs font-semibold text-brand-600">{message.sender.fullName}</p>
        )}

        {isDeleted ? (
          <p className={`italic ${isOwn ? 'text-white/70' : 'text-ink-faint'}`}>This message was deleted</p>
        ) : isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === 'Escape') setIsEditing(false);
              }}
              rows={2}
              className="w-full resize-none rounded-lg border-0 bg-white/10 p-2 text-sm text-inherit outline-none ring-1 ring-white/30 focus:ring-white/60"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setIsEditing(false)} className="opacity-80 hover:opacity-100">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="font-semibold opacity-90 hover:opacity-100">
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.type === 'TEXT' && <p className="whitespace-pre-wrap break-words">{message.text}</p>}

            {message.type === 'IMAGE' && message.fileUrl && (
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="block overflow-hidden rounded-xl"
              >
                <img
                  src={message.fileUrl}
                  alt="Shared image"
                  className="block max-h-72 w-auto max-w-[280px] rounded-xl object-cover"
                  loading="lazy"
                />
              </button>
            )}

            {message.type === 'FILE' && message.fileUrl && (
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left ${isOwn ? 'bg-white/10' : 'bg-surface-muted'}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isOwn ? 'bg-white/15' : 'bg-white'}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 3h6l5 5v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {getFileNameFromUrl(message.fileUrl)}
                </span>
              </button>
            )}
          </>
        )}

        {!isEditing && (
          <div className={`mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-white/70' : 'text-ink-faint'}`}>
            {message.editedAt && !isDeleted && <span className="text-[11px] italic">edited</span>}
            <span className="text-[11px]">{formatMessageTime(message.createdAt)}</span>
            {isOwn && !isDeleted && <MessageStatusTicks message={message} recipientId={recipientId} />}
          </div>
        )}

        {(canEdit || canDelete) && !isEditing && (
          <div className="absolute -top-3 right-1 hidden group-hover:block">
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-soft shadow-panel hover:text-ink"
                aria-label="Message options"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-10 w-32 overflow-hidden rounded-lg border border-surface-border bg-white text-xs shadow-panel">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setMenuOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left font-medium text-ink hover:bg-surface-muted"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="block w-full px-3 py-2 text-left font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {(message.type === 'IMAGE' || message.type === 'FILE') && message.fileUrl && (
        <MediaViewerModal
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          type={message.type}
          url={message.fileUrl}
          fileName={message.type === 'FILE' ? getFileNameFromUrl(message.fileUrl) : undefined}
        />
      )}
    </div>
  );
}