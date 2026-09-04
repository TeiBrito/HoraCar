'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  Trash2,
  AlertTriangle,
  Check,
  Sun,
  Sunset,
  Moon,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Booking, DriverId, TimeSlot, DRIVERS, TIME_SLOT_LABELS } from '@/types';
import { getDateRangeArray } from '@/lib/bookingsService';
import styles from './modal.module.css';

interface BookingModalProps {
  isOpen: boolean;
  selectedDate: string; // YYYY-MM-DD
  existingBooking?: Booking;
  allBookings: Booking[];
  onClose: () => void;
  onSave: (booking: {
    id?: string;
    date: string;
    driver: DriverId;
    slot: TimeSlot;
    note?: string;
  }) => Promise<void>;
  onSaveRange: (range: {
    startDate: string;
    endDate: string;
    driver: DriverId;
    slot: TimeSlot;
    note?: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  selectedDate,
  existingBooking,
  allBookings,
  onClose,
  onSave,
  onSaveRange,
  onDelete,
}) => {
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [startDate, setStartDate] = useState(selectedDate);
  const [endDate, setEndDate] = useState(selectedDate);
  const [driver, setDriver] = useState<DriverId>('tei');
  const [slot, setSlot] = useState<TimeSlot>('all_day');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingBooking) {
      setIsRangeMode(false);
      setStartDate(existingBooking.date);
      setEndDate(existingBooking.date);
      setDriver(existingBooking.driver);
      setSlot(existingBooking.slot);
      setNote(existingBooking.note || '');
    } else {
      setIsRangeMode(false);
      setStartDate(selectedDate);
      setEndDate(selectedDate);
      const lastDriver = localStorage.getItem('horacar_preferred_driver') as DriverId;
      if (lastDriver && (lastDriver === 'tei' || lastDriver === 'adan')) {
        setDriver(lastDriver);
      } else {
        setDriver('tei');
      }
      setSlot('all_day');
      setNote('');
    }
  }, [existingBooking, isOpen, selectedDate]);

  if (!isOpen) return null;

  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const datesInRange = isRangeMode ? getDateRangeArray(startDate, endDate) : [startDate];

  // Quick Range Presets
  const applyPresetWeekend = () => {
    const [y, m, d] = startDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    // Find next Saturday
    const dayOfWeek = curr.getDay(); // 0 is Sun, 6 is Sat
    const daysUntilSat = (6 - dayOfWeek + 7) % 7;
    const sat = new Date(curr);
    sat.setDate(curr.getDate() + daysUntilSat);

    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);

    const format = (dt: Date) => {
      const yr = dt.getFullYear();
      const mo = String(dt.getMonth() + 1).padStart(2, '0');
      const da = String(dt.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    };

    setStartDate(format(sat));
    setEndDate(format(sun));
  };

  const applyPresetDays = (daysCount: number) => {
    const [y, m, d] = startDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + (daysCount - 1));

    const yr = curr.getFullYear();
    const mo = String(curr.getMonth() + 1).padStart(2, '0');
    const da = String(curr.getDate()).padStart(2, '0');
    setEndDate(`${yr}-${mo}-${da}`);
  };

  // Check conflicts across all dates in range
  const conflictingBookings = allBookings.filter(
    (b) =>
      datesInRange.includes(b.date) &&
      (!existingBooking || b.id !== existingBooking.id) &&
      (b.slot === 'all_day' || slot === 'all_day' || b.slot === slot)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      localStorage.setItem('horacar_preferred_driver', driver);
      if (isRangeMode && startDate !== endDate) {
        await onSaveRange({
          startDate,
          endDate,
          driver,
          slot,
          note,
        });
      } else {
        await onSave({
          id: existingBooking?.id,
          date: startDate,
          driver,
          slot,
          note,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingBooking) return;
    setIsSubmitting(true);
    try {
      await onDelete(existingBooking.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.badge}>
              <Calendar size={13} />
              <span>
                {isRangeMode ? `${datesInRange.length} días seleccionados` : startDate}
              </span>
            </div>
            <h3 className={styles.title}>
              {isRangeMode
                ? `${formatDateFriendly(startDate)} – ${formatDateFriendly(endDate)}`
                : formatDateFriendly(startDate)}
            </h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Mode Switcher: 1 Día vs Rango */}
          {!existingBooking && (
            <div className={styles.modeSwitchRow}>
              <button
                type="button"
                className={`${styles.modeBtn} ${!isRangeMode ? styles.modeActive : ''}`}
                onClick={() => {
                  setIsRangeMode(false);
                  setEndDate(startDate);
                }}
              >
                <Calendar size={14} />
                <span>1 Solo Día</span>
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${isRangeMode ? styles.modeActive : ''}`}
                onClick={() => {
                  setIsRangeMode(true);
                  if (startDate === endDate) {
                    applyPresetDays(2);
                  }
                }}
              >
                <Layers size={14} />
                <span>Rango / Varios Días</span>
              </button>
            </div>
          )}

          {/* Date Range Selectors & Presets */}
          {isRangeMode && !existingBooking && (
            <div className={styles.rangeBox}>
              <div className={styles.rangeInputs}>
                <div className={styles.rangeField}>
                  <span className={styles.inputLabel}>Desde</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value > endDate) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className={styles.dateInput}
                  />
                </div>
                <div className={styles.rangeArrow}>
                  <ArrowRight size={14} />
                </div>
                <div className={styles.rangeField}>
                  <span className={styles.inputLabel}>Hasta</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
              </div>

              {/* Presets */}
              <div className={styles.presetsRow}>
                <span className={styles.presetsLabel}>Atajos:</span>
                <button
                  type="button"
                  onClick={applyPresetWeekend}
                  className={styles.presetBtn}
                >
                  Fin de semana
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetDays(3)}
                  className={styles.presetBtn}
                >
                  3 Días
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetDays(7)}
                  className={styles.presetBtn}
                >
                  1 Semana
                </button>
              </div>
            </div>
          )}

          {/* Driver Selection */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <User size={15} />
              <span>Conductor</span>
            </label>
            <div className={styles.driverSelector}>
              <button
                type="button"
                className={`${styles.driverOption} ${styles.teiOption} ${driver === 'tei' ? styles.selectedTei : ''}`}
                onClick={() => setDriver('tei')}
              >
                <span className={styles.driverInitial}>T</span>
                <span className={styles.driverLabelText}>Tei</span>
                {driver === 'tei' && <Check size={16} className={styles.checkIcon} />}
              </button>

              <button
                type="button"
                className={`${styles.driverOption} ${styles.adanOption} ${driver === 'adan' ? styles.selectedAdan : ''}`}
                onClick={() => setDriver('adan')}
              >
                <span className={styles.driverInitial}>A</span>
                <span className={styles.driverLabelText}>Adán</span>
                {driver === 'adan' && <Check size={16} className={styles.checkIcon} />}
              </button>
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <Clock size={15} />
              <span>Franja de Uso</span>
            </label>
            <div className={styles.slotsGrid}>
              <button
                type="button"
                className={`${styles.slotButton} ${slot === 'all_day' ? styles.slotActive : ''}`}
                onClick={() => setSlot('all_day')}
              >
                <Clock size={16} />
                <div className={styles.slotInfo}>
                  <span className={styles.slotTitle}>Día Completo</span>
                  <span className={styles.slotDesc}>Jornada entera</span>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.slotButton} ${slot === 'morning' ? styles.slotActive : ''}`}
                onClick={() => setSlot('morning')}
              >
                <Sun size={16} />
                <div className={styles.slotInfo}>
                  <span className={styles.slotTitle}>Mañana</span>
                  <span className={styles.slotDesc}>07:00 – 14:00</span>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.slotButton} ${slot === 'afternoon' ? styles.slotActive : ''}`}
                onClick={() => setSlot('afternoon')}
              >
                <Sunset size={16} />
                <div className={styles.slotInfo}>
                  <span className={styles.slotTitle}>Tarde</span>
                  <span className={styles.slotDesc}>14:00 – 20:00</span>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.slotButton} ${slot === 'night' ? styles.slotActive : ''}`}
                onClick={() => setSlot('night')}
              >
                <Moon size={16} />
                <div className={styles.slotInfo}>
                  <span className={styles.slotTitle}>Noche</span>
                  <span className={styles.slotDesc}>20:00 – Madrugada</span>
                </div>
              </button>
            </div>
          </div>

          {/* Conflict Warning */}
          {conflictingBookings.length > 0 && (
            <div className={styles.conflictBanner}>
              <AlertTriangle size={17} className={styles.warningIcon} />
              <div className={styles.conflictText}>
                <span className={styles.conflictTitle}>Coincidencia de turno</span>
                <p className={styles.conflictDesc}>
                  {DRIVERS[conflictingBookings[0].driver].name} ya tiene turno el{' '}
                  <strong>{conflictingBookings[0].date}</strong> (
                  {TIME_SLOT_LABELS[conflictingBookings[0].slot].label}).
                  {conflictingBookings.length > 1 && ` Y en ${conflictingBookings.length - 1} día(s) más del rango.`}
                </p>
              </div>
            </div>
          )}

          {/* Optional Note */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <FileText size={15} />
              <span>Nota / Motivo (opcional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Viaje de fin de semana, compras, vacaciones..."
              className={styles.textInput}
              maxLength={80}
            />
          </div>

          {/* Actions */}
          <div className={styles.actionsRow}>
            {existingBooking ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className={styles.deleteBtn}
                title="Liberar este turno"
              >
                <Trash2 size={16} />
                <span>Liberar Turno</span>
              </button>
            ) : (
              <div />
            )}

            <div className={styles.mainActions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelBtn}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Guardando...'
                  : existingBooking
                  ? 'Actualizar'
                  : isRangeMode && datesInRange.length > 1
                  ? `Reservar ${datesInRange.length} Días`
                  : 'Confirmar Turno'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
