'use client';

import { Star, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

import type { Trip } from '@/shared/types/domain';

export default function ReviewModal({
  trip,
  submitting,
  onClose,
  onSubmit,
}: {
  trip: Trip;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (rating: number, body: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(rating, body);
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="review-form" onSubmit={submit}>
        <header>
          <div>
            <small>COMPLETED STAY</small>
            <h2>Review your stay</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close review">
            <X size={20} />
          </button>
        </header>
        <p>{trip.title}</p>
        <fieldset>
          <legend>How was your stay?</legend>
          <div className="review-stars" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                className={value <= rating ? 'active' : ''}
                onClick={() => setRating(value)}
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
              >
                <Star size={30} fill={value <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Tell future guests about the home
          <textarea
            required
            minLength={10}
            maxLength={1000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What stood out about your stay?"
          />
          <small>{body.length}/1000</small>
        </label>
        <footer>
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary compact" disabled={submitting || body.trim().length < 10}>
            {submitting ? 'Publishing...' : 'Publish review'}
          </button>
        </footer>
      </form>
    </div>
  );
}
