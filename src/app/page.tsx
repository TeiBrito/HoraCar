'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { CalendarView } from '@/components/Calendar/CalendarView';
import { UpcomingList } from '@/components/Upcoming/UpcomingList';
import { StatsSummary } from '@/components/Stats/StatsSummary';
import { BookingModal } from '@/components/BookingModal/BookingModal';
import { FirebaseConfigModal } from '@/components/FirebaseModal/FirebaseConfigModal';
import {
  subscribeToBookings,
  saveBooking,
  saveBookingRange,
  removeBooking,
} from '@/lib/bookingsService';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Booking, DriverId, TimeSlot } from '@/types';
import { Plus } from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterDriver, setFilterDriver] = useState<DriverId | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = subscribeToBookings((updatedBookings) => {
      setBookings(updatedBookings);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenDate = (dateStr: string, existing?: Booking) => {
    setSelectedDate(dateStr);
    setEditingBooking(existing);
    setIsModalOpen(true);
  };

  const handleSaveBooking = async (data: {
    id?: string;
    date: string;
    driver: DriverId;
    slot: TimeSlot;
    note?: string;
  }) => {
    await saveBooking(data);
  };

  const handleSaveBookingRange = async (range: {
    startDate: string;
    endDate: string;
    driver: DriverId;
    slot: TimeSlot;
    note?: string;
  }) => {
    await saveBookingRange(range);
  };

  const handleDeleteBooking = async (id: string) => {
    await removeBooking(id);
  };

  const handleQuickAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    handleOpenDate(today);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className={styles.appContainer}>
      <Header
        isCloudConnected={isFirebaseConfigured}
        filterDriver={filterDriver}
        onFilterChange={setFilterDriver}
        onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
      />

      <main className={styles.mainContent}>
        <div className={styles.grid}>
          {/* Main Calendar View */}
          <section className={styles.calendarSection}>
            <CalendarView
              bookings={bookings}
              filterDriver={filterDriver}
              onSelectDate={handleOpenDate}
            />
          </section>

          {/* Sidebar: Stats + Upcoming */}
          <aside className={styles.sidebarSection}>
            <StatsSummary bookings={bookings} />
            <UpcomingList
              bookings={bookings}
              filterDriver={filterDriver}
              onEditBooking={(b) => handleOpenDate(b.date, b)}
              onDeleteBooking={handleDeleteBooking}
            />
          </aside>
        </div>
      </main>

      {/* Floating Action Button for mobile quick booking */}
      <button
        onClick={handleQuickAdd}
        className={styles.fabButton}
        title="Reservar turno hoy"
      >
        <Plus size={20} strokeWidth={2.4} />
        <span className={styles.fabText}>Añadir Turno</span>
      </button>

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={isModalOpen}
        selectedDate={selectedDate}
        existingBooking={editingBooking}
        allBookings={bookings}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBooking(undefined);
        }}
        onSave={handleSaveBooking}
        onSaveRange={handleSaveBookingRange}
        onDelete={handleDeleteBooking}
      />

      {/* Firebase Cloud Info Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        isCloudConnected={isFirebaseConfigured}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}

