import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'IMAGE' | 'FILE';
  url: string;
  fileName?: string;
}

type PreviewKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'unsupported';

const TEXT_EXTENSIONS = ['txt', 'md', 'json', 'csv', 'log', 'js', 'ts', 'tsx', 'jsx', 'css', 'html', 'xml', 'yml', 'yaml'];
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'mkv', 'avi'];
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];

function getExtension(url: string, fileName?: string): string | undefined {
  const source = fileName ?? url.split('?')[0];
  const match = source.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1];
}

function getPreviewKind(type: 'IMAGE' | 'FILE', url: string, fileName?: string): PreviewKind {
  if (type === 'IMAGE') return 'image';

  const ext = getExtension(url, fileName);
  if (!ext) return 'unsupported';
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  if (TEXT_EXTENSIONS.includes(ext)) return 'text';
  return 'unsupported';
}

/** Fetches small text files so we can render their contents in-modal. */
function useTextPreview(url: string, enabled: boolean) {
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setText(null);
    setFailed(false);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load file');
        return res.text();
      })
      .then((content) => {
        if (!cancelled) setText(content);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url, enabled]);

  return { text, failed };
}

export function MediaViewerModal({ isOpen, onClose, type, url, fileName }: MediaViewerModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    // Prevent the page behind the lightbox from scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const kind = getPreviewKind(type, url, fileName);
  const { text, failed: textFailed } = useTextPreview(url, isOpen && kind === 'text');

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/85" />

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* max-h/max-w bound every branch so nothing can ever force horizontal
          scroll on the page; any overflow inside a branch scrolls vertically only. */}
      <div
        className="relative z-10 flex max-h-[88vh] w-[min(92vw,720px)] max-w-full justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {kind === 'image' && (
          <img
            src={url}
            alt="Shared image"
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        )}

        {kind === 'pdf' && (
          <iframe
            src={url}
            title={fileName ?? 'Document preview'}
            className="h-[85vh] w-full rounded-lg border-0 bg-white shadow-2xl"
          />
        )}

        {kind === 'video' && (
          <video src={url} controls autoPlay className="max-h-[85vh] max-w-full rounded-lg shadow-2xl" />
        )}

        {kind === 'audio' && (
          <div className="w-full rounded-2xl bg-white p-6 shadow-2xl">
            <p className="mb-4 truncate text-sm font-medium text-ink">{fileName ?? 'Audio file'}</p>
            <audio src={url} controls autoPlay className="w-full" />
          </div>
        )}

        {kind === 'text' && (
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            {text === null && !textFailed && <p className="text-sm text-ink-faint">Loading preview…</p>}
            {textFailed && <p className="text-sm text-ink-faint">Couldn't load a preview for this file.</p>}
            {text !== null && (
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-ink">{text}</pre>
            )}
          </div>
        )}

        {kind === 'unsupported' && (
          <div className="flex w-80 max-w-full flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-ink-soft">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 3h6l5 5v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="break-all text-sm font-medium text-ink">{fileName ?? 'File'}</p>
            <p className="text-xs text-ink-faint">Preview isn't available for this file type.</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}