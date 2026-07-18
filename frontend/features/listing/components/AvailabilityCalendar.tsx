'use client';

import { addDays, differenceInCalendarDays, format, parseISO, startOfToday } from 'date-fns';
import { Keyboard } from 'lucide-react';
import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';

import type { UnavailablePeriod } from '@/shared/types/domain';

export default function AvailabilityCalendar({
  city,
  unavailablePeriods = [],
  range,
  onRangeChange,
}: {
  city: string;
  unavailablePeriods?: UnavailablePeriod[];
  range?: DateRange;
  onRangeChange?: (range: DateRange | undefined) => void;
}) {
  const [internalRange, setInternalRange] = useState<DateRange>();
  const selectedRange = range ?? internalRange;
  const nights =
    selectedRange?.from && selectedRange.to
      ? differenceInCalendarDays(selectedRange.to, selectedRange.from)
      : 0;
  const disabled = [
    { before: startOfToday() },
    ...unavailablePeriods.map((period) => ({
      from: parseISO(period.check_in),
      to: addDays(parseISO(period.check_out), -1),
    })),
  ];

  function selectRange(nextRange: DateRange | undefined) {
    setInternalRange(nextRange);
    onRangeChange?.(nextRange);
  }

  return (
    <section className="detail-calendar-section">
      <header>
        <div>
          <h2>
            {nights
              ? `${nights} night${nights === 1 ? '' : 's'} in ${city}`
              : `Select dates in ${city}`}
          </h2>
          <p>
            {selectedRange?.from && selectedRange.to
              ? `${format(selectedRange.from, 'MMM d, yyyy')} - ${format(selectedRange.to, 'MMM d, yyyy')}`
              : 'Add your travel dates for exact pricing'}
          </p>
        </div>
      </header>
      <DayPicker
        mode="range"
        min={1}
        numberOfMonths={2}
        selected={selectedRange}
        onSelect={selectRange}
        disabled={disabled}
        excludeDisabled
        defaultMonth={startOfToday()}
      />
      <footer>
        <Keyboard size={19} />
        {selectedRange?.from && <button onClick={() => selectRange(undefined)}>Clear dates</button>}
      </footer>
    </section>
  );
}
