'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { CalendarView } from '@/components/Calendar/CalendarView';
import { UpcomingList } from '@/components/Upcoming/UpcomingList';
import { StatsSummary } from '@/components/Stats/StatsSummary';
import { BookingModal } from '@/components/BookingModal/BookingModal';
import { MaintenanceSection } from '@/components/Maintenance/MaintenanceSection';
import { MaintenanceModal } from '@/components/Maintenance/MaintenanceModal';
import { FuelToggleWidget } from '@/components/FuelTurn/FuelToggleWidget';
import { FirebaseConfigModal } from '@/components/FirebaseModal/FirebaseConfigModal';
import {
  subscribeToBookings,
  saveBooking,
  saveBookingRange,
  removeBooking,
} from '@/lib/bookingsService';
import {
  subscribeToMaintenance,
  saveMaintenance,
  toggleMaintenanceCompleted,
  removeMaintenance,
} from '@/lib/maintenanceService';
import {
  subscribeToFuelTurn,
  setFuelDriver,
  toggleFuelTurn,
} from '@/lib/fuelService';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  Booking,
  DriverId,
  TimeSlot,
  MaintenanceItem,
  MaintenanceType,
  MaintenanceResponsible,
  FuelTurnState,
} from '@/types';
import { Plus } from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  const [activeView, setActiveView] = useState<'calendar' | 'maintenance'>('calendar');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [fuelState, setFuelState] = useState<FuelTurnState>({ currentDriver: 'tei' });
  const [filterDriver, setFilterDriver] = useState<DriverId | 'all'>('all');
  
  // Booking Modal states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);

  // Maintenance Modal states
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceItem | undefined>(undefined);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState<boolean>(false);

  // Config Modal
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const unsubBookings = subscribeToBookings((updated) => {
      setBookings(updated);
    });

    const unsubMaint = subscribeToMaintenance((updated) => {
      setMaintenanceItems(updated);
    });

    const unsubFuel = subscribeToFuelTurn((updated) => {
      setFuelState(updated);
    });

    return () => {
      unsubBookings();
      unsubMaint();
      unsubFuel();
    };
  }, []);

  const handleOpenDate = (dateStr: string, existing?: Booking) => {
    setSelectedDate(dateStr);
    setEditingBooking(existing);
    setIsBookingModalOpen(true);
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

  // Maintenance Handlers
  const handleOpenNewMaintenance = () => {
    setEditingMaintenance(undefined);
    setIsMaintModalOpen(true);
  };

  const handleEditMaintenance = (item: MaintenanceItem) => {
    setEditingMaintenance(item);
    setIsMaintModalOpen(true);
  };

  const handleSaveMaintenance = async (data: {
    id?: string;
    type: MaintenanceType;
    title: string;
    date: string;
    responsible: MaintenanceResponsible;
    kilometers?: number;
    cost?: number;
    notes?: string;
    completed?: boolean;
  }) => {
    await saveMaintenance(data);
  };

  const handleToggleMaintCompleted = async (id: string, completed: boolean) => {
    await toggleMaintenanceCompleted(id, completed);
  };

  const handleDeleteMaintenance = async (id: string) => {
    await removeMaintenance(id);
  };

  const handleQuickAdd = () => {
    if (activeView === 'maintenance') {
      handleOpenNewMaintenance();
    } else {
      const today = new Date().toISOString().split('T')[0];
      handleOpenDate(today);
    }
  };

  const pendingMaintenanceCount = maintenanceItems.filter((m) => !m.completed).length;

  if (!isMounted) {
    return null;
  }

  return (
    <div className={styles.appContainer}>
      <Header
        isCloudConnected={isFirebaseConfigured}
        activeView={activeView}
        onViewChange={setActiveView}
        filterDriver={filterDriver}
        onFilterChange={setFilterDriver}
        onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
        pendingMaintenanceCount={pendingMaintenanceCount}
      />

      <main className={styles.mainContent}>
        {activeView === 'calendar' ? (
          <div className={styles.grid}>
            {/* Main Calendar View */}
            <section className={styles.calendarSection}>
              <CalendarView
                bookings={bookings}
                maintenanceItems={maintenanceItems}
                filterDriver={filterDriver}
                onSelectDate={handleOpenDate}
                onSelectMaintenance={handleEditMaintenance}
              />
            </section>

            {/* Sidebar: Fuel Turn + Stats + Upcoming */}
            <aside className={styles.sidebarSection}>
              <FuelToggleWidget
                fuelState={fuelState}
                onSetDriver={setFuelDriver}
                onToggleTurn={() => toggleFuelTurn(fuelState)}
              />
              <StatsSummary bookings={bookings} />
              <UpcomingList
                bookings={bookings}
                filterDriver={filterDriver}
                onEditBooking={(b) => handleOpenDate(b.date, b)}
                onDeleteBooking={handleDeleteBooking}
              />
            </aside>
          </div>
        ) : (
          /* Maintenance & ITV Section */
          <section className={styles.maintFullSection}>
            <MaintenanceSection
              items={maintenanceItems}
              onAddNew={handleOpenNewMaintenance}
              onEdit={handleEditMaintenance}
              onToggleCompleted={handleToggleMaintCompleted}
              onDelete={handleDeleteMaintenance}
            />
          </section>
        )}
      </main>

      {/* Floating Action Button for mobile quick action */}
      <button
        onClick={handleQuickAdd}
        className={styles.fabButton}
        title={activeView === 'maintenance' ? 'Añadir Mantenimiento' : 'Reservar turno'}
      >
        <Plus size={20} strokeWidth={2.4} />
        <span className={styles.fabText}>
          {activeView === 'maintenance' ? 'Nuevo Mantenimiento' : 'Añadir Turno'}
        </span>
      </button>

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        selectedDate={selectedDate}
        existingBooking={editingBooking}
        allBookings={bookings}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingBooking(undefined);
        }}
        onSave={handleSaveBooking}
        onSaveRange={handleSaveBookingRange}
        onDelete={handleDeleteBooking}
      />

      {/* Maintenance Form Modal */}
      <MaintenanceModal
        isOpen={isMaintModalOpen}
        itemToEdit={editingMaintenance}
        onClose={() => {
          setIsMaintModalOpen(false);
          setEditingMaintenance(undefined);
        }}
        onSave={handleSaveMaintenance}
        onDelete={handleDeleteMaintenance}
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
