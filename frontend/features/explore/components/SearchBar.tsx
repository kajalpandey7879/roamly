'use client';
import { Search, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
export default function SearchBar() {
  const router = useRouter(),
    q = useSearchParams();
  const [where, setWhere] = useState(q.get('location') || '');
  const [guests, setGuests] = useState(Number(q.get('guests') || 1));
  const [checkin, setCheckin] = useState(q.get('checkin') || '');
  const [checkout, setCheckout] = useState(q.get('checkout') || '');
  function go() {
    const p = new URLSearchParams();
    if (where) p.set('location', where);
    p.set('guests', String(guests));
    if (checkin) p.set('checkin', checkin);
    if (checkout) p.set('checkout', checkout);
    router.push('/?' + p);
  }
  return (
    <div className="search-shell">
      <label>
        <span>Where</span>
        <input
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="Search destinations"
        />
      </label>
      <label>
        <span>Check in</span>
        <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} />
      </label>
      <label>
        <span>Check out</span>
        <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} />
      </label>
      <label className="guest-field">
        <span>Who</span>
        <div>
          <Users size={15} />
          <input
            type="number"
            min="1"
            max="12"
            value={guests}
            onChange={(e) => setGuests(+e.target.value)}
          />
        </div>
      </label>
      <button onClick={go} className="search-button" title="Search">
        <Search size={20} />
      </button>
    </div>
  );
}
