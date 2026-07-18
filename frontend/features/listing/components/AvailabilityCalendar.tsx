'use client';

import { addDays, differenceInCalendarDays, format, parseISO, startOfToday } from 'date-fns';
import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';

import type { UnavailablePeriod } from '@/shared/types/domain';

export default function AvailabilityCalendar({
  city,
  unavailablePeriods = [],
}: {
  city: string;
  unavailablePeriods?: UnavailablePeriod[];
}) {
  const [range, setRange] = useState<DateRange>();
  const nights =
    range?.from && range.to ? differenceInCalendarDays(range.to, range.from) : 0;
  const disabled = [
    { before: startOfToday() },
    ...unavailablePeriods.map((period) => ({
      from: parseISO(period.check_in),
      to: addDays(parseISO(period.check_out), -1),
    })),
  ];

  return (
    <section className="detail-calendar-section">
      <header>
        <div>
          <h2>{nights ? `${nights} night${nights === 1 ? '' : 's'} in ${city}` : `Select dates in ${city}`}</h2>
          <p>
            {range?.from && range.to
              ? `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`
              : 'Add your travel dates for exact pricing'}
          </p>
        </div>
        {range?.from && (
          <button onClick={() => setRange(undefined)}>
            Clear dates
          </button>
        )}
      </header>
      <DayPicker
        mode="range"
        min={1}
        numberOfMonths={2}
        selected={range}
        onSelect={setRange}
        disabled={disabled}
        excludeDisabled
        defaultMonth={startOfToday()}
      />
    </section>
  );
}
