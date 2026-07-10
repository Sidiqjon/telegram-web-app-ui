import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'IMAGE' | 'FILE';
  url: string;
  fileName?: string;
}

function isPdfUrl(url: string, fileName?: string): boolean {
  // const clean = url.split('?')[0].toLowerCase();
  // return clean.endsWith('.pdf') || !!fileName?.toLowerCase().endsWith('.pdf');
  return true
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

  if (!isOpen) return null;

  const showPdf = type === 'FILE' && isPdfUrl(url, fileName);

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

      <div className="relative z-10 max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
        {type === 'IMAGE' && (
          <img
            src={url}
            alt="Shared image"
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        )}

        {showPdf && (
          <div className="h-[85vh] w-[80vw] max-w-5xl rounded-lg overflow-hidden bg-white shadow-2xl">
            <iframe
              src={url}
              title={fileName ?? "Document preview"}
              className="h-full w-full border-0"
            />
          </div>
        )}

        {type === 'FILE' && !showPdf && (
          <div className="flex w-80 max-w-[85vw] flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-2xl">
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