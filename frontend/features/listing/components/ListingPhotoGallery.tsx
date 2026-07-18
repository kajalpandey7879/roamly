'use client';

import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';

export default function ListingPhotoGallery({
  title,
  images,
  onClose,
}: {
  title: string;
  images: string[];
  onClose: () => void;
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
    <section className="photo-gallery-overlay" role="dialog" aria-modal="true" aria-label="All property photos">
      <header>
        <button title="Back to listing" aria-label="Back to listing" onClick={onClose}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2>{title}</h2>
          <span>{images.length} photos</span>
        </div>
      </header>
      <div className="photo-gallery-mosaic">
        {images.map((image, index) => (
          <figure key={`${image}-${index}`} className={index === 0 ? 'featured' : ''}>
            <Image
              src={image}
              alt={`${title} photo ${index + 1}`}
              width={1200}
              height={900}
              sizes={index === 0 ? '(max-width: 700px) 100vw, 900px' : '(max-width: 700px) 100vw, 450px'}
              priority={index < 2}
            />
            <figcaption>{index + 1} / {images.length}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
