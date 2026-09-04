'use client';

import React from 'react';
import { Calendar, Clock, Edit2, Trash2, ArrowRight, Sun, Sunset, Moon } from 'lucide-react';
import { Booking, DriverId, DRIVERS, TIME_SLOT_LABELS } from '@/types';
import styles from './upcoming.module.css';

interface UpcomingListProps {
  bookings: Booking[];
  filterDriver: DriverId | 'all';
  onEditBooking: (booking: Booking) => void;
  onDeleteBooking: (id: string) => void;
}

export const UpcomingList: React.FC<UpcomingListProps> = ({
  bookings,
  filterDriver,
  onEditBooking,
  onDeleteBooking,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter for future and today, sorted ascending
  const upcoming = bookings
    .filter((b) => b.date >= todayStr)
    .filter((b) => (filterDriver === 'all' ? true : b.driver === filterDriver))
    .sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));

  const formatDateFriendly = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const isToday = (dateStr: string) => dateStr === todayStr;

  const getSlotIcon = (slot: string) => {
    switch (slot) {
      case 'morning':
        return <Sun size={13} />;
      case 'afternoon':
        return <Sunset size={13} />;
      case 'night':
        return <Moon size={13} />;
      default:
        return <Clock size={13} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Próximos Turnos</h3>
        <span className={styles.countBadge}>{upcoming.length}</span>
      </div>

      {upcoming.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar size={24} className={styles.emptyIcon} />
          <p className={styles.emptyText}>No hay turnos programados próximos</p>
          <span className={styles.emptySubtext}>Haz clic en cualquier día del calendario para asignar uno</span>
        </div>
      ) : (
        <div className={styles.list}>
          {upcoming.map((b) => {
            const driver = DRIVERS[b.driver];
            const isTei = b.driver === 'tei';
            const today = isToday(b.date);

            return (
              <div
                key={b.id}
                className={`${styles.card} ${isTei ? styles.cardTei : styles.cardAdan}`}
                onClick={() => onEditBooking(b)}
              >
                <div className={styles.dateBlock}>
                  <span className={styles.dateText}>{formatDateFriendly(b.date)}</span>
                  {today && <span className={styles.todayPill}>HOY</span>}
                </div>

                <div className={styles.infoBlock}>
                  <div className={styles.driverLine}>
                    <span className={styles.driverName}>{driver.name}</span>
                    <span className={styles.slotBadge}>
                      {getSlotIcon(b.slot)}
                      <span>{TIME_SLOT_LABELS[b.slot].label}</span>
                    </span>
                  </div>
                  {b.note && <p className={styles.noteText}>{b.note}</p>}
                </div>

                <div className={styles.cardActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBooking(b);
                    }}
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionDelete}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBooking(b.id);
                    }}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
