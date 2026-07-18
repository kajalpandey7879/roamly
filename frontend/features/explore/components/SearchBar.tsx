'use client';

import { addMonths, format, isValid, parseISO, startOfMonth, startOfToday } from 'date-fns';
import { Building2, CalendarDays, MapPin, Minus, Navigation, Plus, Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import toast from 'react-hot-toast';

type SearchPanel = 'destination' | 'dates' | 'guests' | null;
type DateMode = 'dates' | 'flexible';
type StayLength = 'weekend' | 'week' | 'month';
type GuestKind = 'adults' | 'children' | 'infants' | 'pets';

interface SearchBarProps {
  variant?: 'home' | 'header';
  searchPath?: string;
}

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

const DESTINATIONS = [
  { name: 'Nearby', detail: "Find what's around you", value: '', icon: Navigation },
  {
    name: 'North Goa, Goa',
    detail: 'Popular beach destination',
    value: 'North Goa',
    icon: Building2,
  },
  {
    name: 'Puducherry, Puducherry',
    detail: 'For sights like Sri Aurobindo Ashram',
    value: 'Puducherry',
    icon: Building2,
  },
  {
    name: 'Mysore, Karnataka',
    detail: 'Great for a weekend getaway',
    value: 'Mysore',
    icon: Building2,
  },
  { name: 'Ooty, Tamil Nadu', detail: 'For nature lovers', value: 'Ooty', icon: MapPin },
  {
    name: 'South Goa, Goa',
    detail: 'Popular beach destination',
    value: 'South Goa',
    icon: Building2,
  },
];

const GUEST_ROWS: Array<{
  key: GuestKind;
  label: string;
  detail: string;
  maximum: number;
}> = [
  { key: 'adults', label: 'Adults', detail: 'Ages 13 or above', maximum: 12 },
  { key: 'children', label: 'Children', detail: 'Ages 2-12', maximum: 12 },
  { key: 'infants', label: 'Infants', detail: 'Under 2', maximum: 5 },
  { key: 'pets', label: 'Pets', detail: 'Bringing a service animal?', maximum: 5 },
];

function dateFromParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export default function SearchBar({ variant = 'home', searchPath = '/' }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const [where, setWhere] = useState(searchParams.get('location') ?? '');
  const [panel, setPanel] = useState<SearchPanel>(null);
  const [dateMode, setDateMode] = useState<DateMode>(
    searchParams.has('flex_months') ? 'flexible' : 'dates',
  );
  const [stayLength, setStayLength] = useState<StayLength>(
    (searchParams.get('flex_length') as StayLength) || 'weekend',
  );
  const [selectedMonths, setSelectedMonths] = useState<string[]>(
    searchParams.get('flex_months')?.split(',').filter(Boolean) ?? [],
  );
  const [flexDays, setFlexDays] = useState(Number(searchParams.get('date_flex') ?? 0));
  const initialGuests = Number(searchParams.get('guests') ?? 0);
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({
    adults: Number(searchParams.get('adults') ?? initialGuests),
    children: Number(searchParams.get('children') ?? 0),
    infants: Number(searchParams.get('infants') ?? 0),
    pets: Number(searchParams.get('pets') ?? 0),
  });
  const [range, setRange] = useState<DateRange | undefined>({
    from: dateFromParam(searchParams.get('check_in')),
    to: dateFromParam(searchParams.get('check_out')),
  });

  const availableMonths = useMemo(
    () => Array.from({ length: 12 }, (_, index) => addMonths(startOfMonth(new Date()), index)),
    [],
  );

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (searchAreaRef.current && !searchAreaRef.current.contains(event.target as Node)) {
        setPanel(null);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setPanel(null);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const countedGuests = guestCounts.adults + guestCounts.children;
  const totalTravellers = countedGuests + guestCounts.infants;

  function openPanel(nextPanel: Exclude<SearchPanel, null>) {
    setPanel((current) => (current === nextPanel ? null : nextPanel));
  }

  function search() {
    if (dateMode === 'dates' && range?.from && !range.to) {
      toast.error('Select a checkout date for a stay of at least one night');
      setPanel('dates');
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    where.trim() ? params.set('location', where.trim()) : params.delete('location');
    params.set('guests', String(Math.max(1, countedGuests)));
    (Object.keys(guestCounts) as GuestKind[]).forEach((key) => {
      guestCounts[key] ? params.set(key, String(guestCounts[key])) : params.delete(key);
    });

    const amenities = params.get('amenities')?.split(',').filter(Boolean) ?? [];
    const withoutPets = amenities.filter((amenity) => amenity !== 'Pets allowed');
    if (guestCounts.pets) withoutPets.push('Pets allowed');
    withoutPets.length
      ? params.set('amenities', [...new Set(withoutPets)].join(','))
      : params.delete('amenities');

    if (dateMode === 'dates') {
      params.delete('flex_length');
      params.delete('flex_months');
      if (range?.from && range.to) {
        params.set('check_in', format(range.from, 'yyyy-MM-dd'));
        params.set('check_out', format(range.to, 'yyyy-MM-dd'));
        flexDays ? params.set('date_flex', String(flexDays)) : params.delete('date_flex');
      } else {
        params.delete('check_in');
        params.delete('check_out');
        params.delete('date_flex');
      }
    } else {
      params.delete('check_in');
      params.delete('check_out');
      params.delete('date_flex');
      params.set('flex_length', stayLength);
      selectedMonths.length
        ? params.set('flex_months', selectedMonths.join(','))
        : params.delete('flex_months');
    }

    params.delete('page');
    router.push(`${searchPath}?${params}`);
    setPanel(null);
  }

  function updateGuestCount(key: GuestKind, direction: -1 | 1, maximum: number) {
    setGuestCounts((current) => {
      const next = { ...current };
      next[key] = Math.max(0, Math.min(maximum, current[key] + direction));
      if (key === 'children' && direction === 1 && current.adults === 0) next.adults = 1;
      if (key === 'adults' && next.adults === 0 && current.children > 0) return current;
      return next;
    });
  }

  function toggleMonth(month: Date) {
    const value = format(month, 'yyyy-MM');
    setSelectedMonths((current) =>
      current.includes(value)
        ? current.filter((monthValue) => monthValue !== value)
        : [...current, value].slice(-3),
    );
  }

  const dateLabel =
    dateMode === 'flexible'
      ? selectedMonths.length
        ? `${capitalize(stayLength)} in ${selectedMonths
            .map((value) => format(parseISO(`${value}-01`), 'MMM'))
            .join(', ')}`
        : `Any ${stayLength}`
      : range?.from
        ? range.to
          ? `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}${flexDays ? ` ±${flexDays}` : ''}`
          : `${format(range.from, 'MMM d')} - Add checkout`
        : variant === 'header'
          ? 'Any weekend'
          : 'Add dates';

  const guestLabel = totalTravellers
    ? `${totalTravellers} guest${totalTravellers === 1 ? '' : 's'}${guestCounts.pets ? `, ${guestCounts.pets} pet${guestCounts.pets === 1 ? '' : 's'}` : ''}`
    : 'Add guests';

  return (
    <div
      className={`search-area${variant === 'header' ? ' compact-header-search' : ''}`}
      ref={searchAreaRef}
    >
      <div className="search-shell">
        <label className={`destination-field${panel === 'destination' ? ' active' : ''}`}>
          <span>Where</span>
          <input
            value={where}
            onChange={(event) => {
              setWhere(event.target.value);
              setPanel('destination');
            }}
            onFocus={() => setPanel('destination')}
            placeholder={variant === 'header' ? 'Map area' : 'Search destinations'}
          />
        </label>
        <button
          className={`search-field date-field${panel === 'dates' ? ' active' : ''}`}
          onClick={() => openPanel('dates')}
        >
          <span>When</span>
          <small>{dateLabel}</small>
        </button>
        <button
          className={`search-field guest-search-field${panel === 'guests' ? ' active' : ''}`}
          onClick={() => openPanel('guests')}
        >
          <span>Who</span>
          <small>{guestLabel}</small>
        </button>
        <button onClick={search} className="search-button">
          <Search size={20} />
          <span>Search</span>
        </button>
      </div>

      {panel === 'destination' && (
        <DestinationPopover
          query={where}
          onSelect={(value) => {
            setWhere(value);
            setPanel('dates');
          }}
        />
      )}

      {panel === 'dates' && (
        <div className="date-popover" role="dialog" aria-label="Choose travel dates">
          <div className="search-mode-tabs" role="tablist" aria-label="Date search mode">
            <button
              className={dateMode === 'dates' ? 'active' : ''}
              onClick={() => setDateMode('dates')}
            >
              Dates
            </button>
            <button
              className={dateMode === 'flexible' ? 'active' : ''}
              onClick={() => setDateMode('flexible')}
            >
              Flexible
            </button>
          </div>

          {dateMode === 'dates' ? (
            <ExactDatePicker
              range={range}
              setRange={setRange}
              flexDays={flexDays}
              setFlexDays={setFlexDays}
              onClose={() => setPanel(null)}
            />
          ) : (
            <div className="flexible-date-picker">
              <h2>How long would you like to stay?</h2>
              <div className="stay-length-options">
                {(['weekend', 'week', 'month'] as StayLength[]).map((length) => (
                  <button
                    key={length}
                    className={stayLength === length ? 'active' : ''}
                    onClick={() => setStayLength(length)}
                  >
                    {capitalize(length)}
                  </button>
                ))}
              </div>
              <h2>When do you want to go?</h2>
              <div className="flexible-months">
                {availableMonths.map((month) => {
                  const value = format(month, 'yyyy-MM');
                  return (
                    <button
                      key={value}
                      className={selectedMonths.includes(value) ? 'active' : ''}
                      onClick={() => toggleMonth(month)}
                    >
                      <CalendarDays size={30} />
                      <b>{format(month, 'MMMM')}</b>
                      <span>{format(month, 'yyyy')}</span>
                    </button>
                  );
                })}
              </div>
              <p className="month-selection-note">Select up to 3 months</p>
            </div>
          )}
        </div>
      )}

      {panel === 'guests' && (
        <div className="guest-popover" role="dialog" aria-label="Choose guests">
          {GUEST_ROWS.map((row) => (
            <div className="guest-row" key={row.key}>
              <span>
                <b>{row.label}</b>
                {row.key === 'pets' ? <u>{row.detail}</u> : <small>{row.detail}</small>}
              </span>
              <div className="guest-stepper">
                <button
                  title={`Remove ${row.label.toLowerCase()}`}
                  disabled={
                    guestCounts[row.key] === 0 ||
                    (row.key === 'adults' && guestCounts.adults === 1 && guestCounts.children > 0)
                  }
                  onClick={() => updateGuestCount(row.key, -1, row.maximum)}
                >
                  <Minus size={16} />
                </button>
                <b>{guestCounts[row.key]}</b>
                <button
                  title={`Add ${row.label.toLowerCase()}`}
                  disabled={
                    guestCounts[row.key] >= row.maximum ||
                    ((row.key === 'adults' || row.key === 'children') && countedGuests >= 16)
                  }
                  onClick={() => updateGuestCount(row.key, 1, row.maximum)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DestinationPopover({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (value: string) => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const suggestions = DESTINATIONS.filter(
    (destination) =>
      !normalizedQuery ||
      destination.name.toLowerCase().includes(normalizedQuery) ||
      destination.detail.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="destination-popover" role="dialog" aria-label="Suggested destinations">
      <h2>Suggested destinations</h2>
      <div>
        {suggestions.length ? (
          suggestions.map((destination, index) => {
            const Icon = destination.icon;
            return (
              <button key={destination.name} onClick={() => onSelect(destination.value)}>
                <span className={`destination-icon color-${(index % 4) + 1}`}>
                  <Icon size={25} />
                </span>
                <span>
                  <b>{destination.name}</b>
                  <small>{destination.detail}</small>
                </span>
              </button>
            );
          })
        ) : (
          <button onClick={() => onSelect(query.trim())}>
            <span className="destination-icon color-1">
              <Search size={23} />
            </span>
            <span>
              <b>Search for &ldquo;{query.trim()}&rdquo;</b>
              <small>Find homes matching this destination</small>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function ExactDatePicker({
  range,
  setRange,
  flexDays,
  setFlexDays,
  onClose,
}: {
  range: DateRange | undefined;
  setRange: (range: DateRange | undefined) => void;
  flexDays: number;
  setFlexDays: (days: number) => void;
  onClose: () => void;
}) {
  return (
    <>
      <header>
        <div>
          <CalendarDays size={19} />
          <span>
            <b>Choose your dates</b>
            <small>Minimum stay: 1 night</small>
          </span>
        </div>
        <button title="Close calendar" onClick={onClose}>
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
        <button className="date-done" disabled={!range?.from || !range.to} onClick={onClose}>
          Done
        </button>
      </footer>
    </>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
