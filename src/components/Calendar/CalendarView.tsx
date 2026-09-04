'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import { Booking, DriverId, DRIVERS, TIME_SLOT_LABELS } from '@/types';
import styles from './calendar.module.css';

interface CalendarViewProps {
  bookings: Booking[];
  filterDriver: DriverId | 'all';
  onSelectDate: (dateStr: string, existingBooking?: Booking) => void;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  bookings,
  filterDriver,
  onSelectDate,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // JS getDay(): 0 is Sunday, 1 is Monday... We want Monday = 0
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const totalDays = lastDayOfMonth.getDate();

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from(
    { length: startingDayOfWeek },
    (_, i) => prevMonthLastDay - startingDayOfWeek + i + 1
  );

  // Current month days
  const currentMonthDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Next month padding days to complete grid (multiples of 7)
  const remainingCells = 42 - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1);

  const todayStr = new Date().toISOString().split('T')[0];

  const getSlotIcon = (slot: string) => {
    switch (slot) {
      case 'morning':
        return <Sun size={11} strokeWidth={2} />;
      case 'afternoon':
        return <Sunset size={11} strokeWidth={2} />;
      case 'night':
        return <Moon size={11} strokeWidth={2} />;
      default:
        return <Clock size={11} strokeWidth={2} />;
    }
  };

  return (
    <div className={styles.calendarContainer}>
      {/* Top Controls */}
      <div className={styles.calendarHeader}>
        <div className={styles.monthDisplay}>
          <h2 className={styles.monthTitle}>
            {MONTH_NAMES[month]} <span className={styles.yearText}>{year}</span>
          </h2>
        </div>

        <div className={styles.navControls}>
          <button
            onClick={handleToday}
            className={styles.todayButton}
            title="Ir al día de hoy"
          >
            Hoy
          </button>
          <div className={styles.btnGroup}>
            <button
              onClick={handlePrevMonth}
              className={styles.navButton}
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              className={styles.navButton}
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Week days labels */}
      <div className={styles.weekGrid}>
        {WEEK_DAYS.map((day, idx) => (
          <div key={idx} className={styles.weekDayCell}>
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className={styles.daysGrid}>
        {/* Prev month days */}
        {prevMonthDays.map((day) => (
          <div key={`prev-${day}`} className={`${styles.dayCell} ${styles.otherMonth}`}>
            <span className={styles.dayNumber}>{day}</span>
          </div>
        ))}

        {/* Current month days */}
        {currentMonthDays.map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;

          // Find bookings for this day
          const dayBookings = bookings.filter((b) => b.date === dateStr);
          const filteredDayBookings =
            filterDriver === 'all'
              ? dayBookings
              : dayBookings.filter((b) => b.driver === filterDriver);

          return (
            <div
              key={`curr-${day}`}
              className={`${styles.dayCell} ${isToday ? styles.todayCell : ''}`}
              onClick={() => onSelectDate(dateStr)}
            >
              <div className={styles.cellHeader}>
                <span className={`${styles.dayNumber} ${isToday ? styles.todayNumber : ''}`}>
                  {day}
                </span>
                <button
                  className={styles.addSlotBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDate(dateStr);
                  }}
                  title="Reservar turno este día"
                >
                  <Plus size={13} strokeWidth={2.4} />
                </button>
              </div>

              {/* Booking Pills */}
              <div className={styles.bookingPillsContainer}>
                {filteredDayBookings.map((b) => {
                  const driver = DRIVERS[b.driver];
                  const isTei = b.driver === 'tei';
                  return (
                    <div
                      key={b.id}
                      className={`${styles.bookingPill} ${isTei ? styles.pillTei : styles.pillAdan}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDate(dateStr, b);
                      }}
                      title={`${driver.name} - ${TIME_SLOT_LABELS[b.slot].label}${b.note ? ` (${b.note})` : ''}`}
                    >
                      <span className={styles.pillHeader}>
                        <span className={styles.driverName}>{driver.name}</span>
                        <span className={styles.slotTag}>
                          {getSlotIcon(b.slot)}
                          <span className={styles.slotLabelText}>
                            {b.slot === 'all_day' ? 'Día entero' : TIME_SLOT_LABELS[b.slot].label}
                          </span>
                        </span>
                      </span>
                      {b.note && <span className={styles.pillNote}>{b.note}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Next month days */}
        {nextMonthDays.map((day) => (
          <div key={`next-${day}`} className={`${styles.dayCell} ${styles.otherMonth}`}>
            <span className={styles.dayNumber}>{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
