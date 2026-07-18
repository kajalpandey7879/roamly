'use client';

import { format, isValid, parseISO, startOfToday } from 'date-fns';
import { CalendarDays, Minus, Plus, Search, Users, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import toast from 'react-hot-toast';

function dateFromParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const [where, setWhere] = useState(searchParams.get('location') ?? '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests') ?? 1));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [flexDays, setFlexDays] = useState(Number(searchParams.get('date_flex') ?? 0));
  const [range, setRange] = useState<DateRange | undefined>({
    from: dateFromParam(searchParams.get('check_in')),
    to: dateFromParam(searchParams.get('check_out')),
  });

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (searchAreaRef.current && !searchAreaRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
        setIsGuestOpen(false);
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  function search() {
    if (range?.from && !range.to) {
      toast.error('Select a checkout date for a stay of at least one night');
      setIsCalendarOpen(true);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    where.trim() ? params.set('location', where.trim()) : params.delete('location');
    params.set('guests', String(guests));
    if (range?.from && range.to) {
      params.set('check_in', format(range.from, 'yyyy-MM-dd'));
      params.set('check_out', format(range.to, 'yyyy-MM-dd'));
      flexDays ? params.set('date_flex', String(flexDays)) : params.delete('date_flex');
    } else {
      params.delete('check_in');
      params.delete('check_out');
      params.delete('date_flex');
    }
    params.delete('page');
    router.push(`/?${params}`);
    setIsCalendarOpen(false);
    setIsGuestOpen(false);
  }

  const dateLabel = range?.from
    ? range.to
      ? `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}${flexDays ? ` ±${flexDays}` : ''}`
      : `${format(range.from, 'MMM d')} - Add checkout`
    : 'Add dates';

  return (
    <div className="search-area" ref={searchAreaRef}>
      <div className="search-shell">
        <label className="destination-field">
          <span>Where</span>
          <input
            value={where}
            onChange={(event) => setWhere(event.target.value)}
            placeholder="Search destinations"
          />
        </label>
        <button
          className="search-field date-field"
          onClick={() => {
            setIsCalendarOpen(!isCalendarOpen);
            setIsGuestOpen(false);
          }}
        >
          <span>When</span>
          <small>{dateLabel}</small>
        </button>
        <button
          className="search-field guest-search-field"
          onClick={() => {
            setIsGuestOpen(!isGuestOpen);
            setIsCalendarOpen(false);
          }}
        >
          <span>Who</span>
          <small>
            {guests} guest{guests === 1 ? '' : 's'}
          </small>
        </button>
        <button onClick={search} className="search-button">
          <Search size={20} />
          <span>Search</span>
        </button>
      </div>

      {isCalendarOpen && (
        <div className="date-popover" role="dialog" aria-label="Choose travel dates">
          <header>
            <div>
              <CalendarDays size={19} />
              <span>
                <b>Choose your dates</b>
                <small>Minimum stay: 1 night</small>
              </span>
            </div>
            <button title="Close calendar" onClick={() => setIsCalendarOpen(false)}>
              <X size={18} />
            </button>
          </header>
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            min={1}
            numberOfMonths={2}
            pagedNavigation
            disabled={{ before: startOfToday() }}
            excludeDisabled
            defaultMonth={range?.from ?? startOfToday()}
          />
          <div className="date-flexibility" aria-label="Date flexibility">
            {[0, 1, 2, 3, 7, 14].map((days) => (
              <button
                key={days}
                className={flexDays === days ? 'active' : ''}
                disabled={!range?.from || !range.to}
                onClick={() => setFlexDays(days)}
              >
                {days === 0 ? 'Exact dates' : `± ${days} day${days === 1 ? '' : 's'}`}
              </button>
            ))}
          </div>
          <footer>
            <button
              className="clear-dates"
              onClick={() => {
                setRange(undefined);
                setFlexDays(0);
              }}
            >
              Clear dates
            </button>
            <span>
              {range?.from && range.to
                ? `${format(range.from, 'MMM d')} to ${format(range.to, 'MMM d')}`
                : 'Select check-in and checkout'}
            </span>
            <button
              className="date-done"
              disabled={!range?.from || !range.to}
              onClick={() => setIsCalendarOpen(false)}
            >
              Done
            </button>
          </footer>
        </div>
      )}

      {isGuestOpen && (
        <div className="guest-popover">
          <div>
            <Users size={20} />
            <span>
              <b>Guests</b>
              <small>Search for up to 12 guests</small>
            </span>
          </div>
          <div className="guest-stepper">
            <button
              title="Remove guest"
              disabled={guests <= 1}
              onClick={() => setGuests(Math.max(1, guests - 1))}
            >
              <Minus size={16} />
            </button>
            <b>{guests}</b>
            <button
              title="Add guest"
              disabled={guests >= 12}
              onClick={() => setGuests(Math.min(12, guests + 1))}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
