'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function ListingModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="listing-modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="listing-modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <button title="Close" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
          <h2>{title}</h2>
          <span />
        </header>
        <div className="listing-modal-content">{children}</div>
      </section>
    </div>
  );
}
