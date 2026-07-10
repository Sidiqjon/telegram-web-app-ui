import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { PublicUser } from '../../types/user.types';

const MAX_FILE_SIZE_MB = 20;

interface MessageInputProps {
  /** Set when chatting in an existing conversation. */
  conversationId?: string;
  /** Set when this is a brand-new chat — nothing exists on the backend yet. */
  draftParticipant?: PublicUser;
}

export function MessageInput({ conversationId, draftParticipant }: MessageInputProps) {
  const [text, setText] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingType, setPendingType] = useState<'IMAGE' | 'FILE' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendText = useChatStore((s) => s.sendText);
  const sendFile = useChatStore((s) => s.sendFile);
  const sendTextToParticipant = useChatStore((s) => s.sendTextToParticipant);
  const sendFileToParticipant = useChatStore((s) => s.sendFileToParticipant);
  const setTyping = useChatStore((s) => s.setTyping);

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    // Typing indicators only make sense once a real conversation/room exists.
    if (conversationId) setTyping(conversationId, e.target.value.trim().length > 0);
  }

  async function handleSendText() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    try {
      if (conversationId) {
        setTyping(conversationId, false);
        await sendText(conversationId, trimmed);
      } else if (draftParticipant) {
        await sendTextToParticipant(draftParticipant, trimmed);
      }
    } catch {
      setFileError('Message failed to send. Please try again.');
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }

  function pickFile(kind: 'IMAGE' | 'FILE') {
    setFileError(null);
    if (kind === 'IMAGE') imageInputRef.current?.click();
    else fileInputRef.current?.click();
  }

  function onFileSelected(e: ChangeEvent<HTMLInputElement>, kind: 'IMAGE' | 'FILE') {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setPendingFile(file);
    setPendingType(kind);
    setPreviewUrl(kind === 'IMAGE' ? URL.createObjectURL(file) : null);
  }

  function cancelPendingFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPendingType(null);
    setPreviewUrl(null);
  }

  async function confirmSendFile() {
    if (!pendingFile || !pendingType) return;
    setIsUploading(true);
    setFileError(null);
    try {
      if (conversationId) {
        await sendFile(conversationId, pendingFile, pendingType);
      } else if (draftParticipant) {
        await sendFileToParticipant(draftParticipant, pendingFile, pendingType);
      }
      cancelPendingFile();
    } catch {
      setFileError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="border-t border-surface-border bg-white px-3 py-3 sm:px-4">
      {fileError && <p className="mb-2 text-xs font-medium text-rose-500">{fileError}</p>}

      {pendingFile && (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-surface-border bg-surface-muted p-2.5">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-ink-soft">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 3h6l5 5v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{pendingFile.name}</p>
            <p className="text-xs text-ink-faint">{(pendingFile.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={cancelPendingFile}
            disabled={isUploading}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={confirmSendFile}
            disabled={isUploading}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isUploading ? 'Sending…' : 'Send'}
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(e) => onFileSelected(e, 'IMAGE')} />
        <input ref={fileInputRef} type="file" hidden onChange={(e) => onFileSelected(e, 'FILE')} />

        <button
          onClick={() => pickFile('IMAGE')}
          aria-label="Attach image"
          className="mb-1 shrink-0 rounded-lg p-2 text-ink-faint hover:bg-surface-muted hover:text-ink-soft"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="8.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m5 17 4.5-4.5a2 2 0 0 1 2.8 0L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <button
          onClick={() => pickFile('FILE')}
          aria-label="Attach file"
          className="mb-1 shrink-0 rounded-lg p-2 text-ink-faint hover:bg-surface-muted hover:text-ink-soft"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="m21 12.5-8.5 8.5a4.5 4.5 0 0 1-6.4-6.4l9-9a3 3 0 0 1 4.3 4.3l-8.9 8.9a1.5 1.5 0 0 1-2.1-2.1l7.8-7.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          rows={1}
          className="thin-scrollbar max-h-32 flex-1 resize-none rounded-2xl border border-surface-border bg-surface-muted px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />

        <button
          onClick={handleSendText}
          disabled={!text.trim()}
          aria-label="Send message"
          className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 20l18-8L3 4l2 8-2 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}