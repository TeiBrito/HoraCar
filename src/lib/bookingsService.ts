import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Booking } from '@/types';
import { notifyDriverChange, getDeviceDriver } from './notificationsService';

const LOCAL_STORAGE_KEY = 'horacar_bookings_v1';

// Mock initial data for local demo mode if empty
const getInitialLocalBookings = (): Booking[] => {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);

  return [
    {
      id: 'demo-1',
      date: formatDate(today),
      driver: 'tei',
      slot: 'morning',
      note: 'Compras y recados',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'demo-2',
      date: formatDate(tomorrow),
      driver: 'adan',
      slot: 'all_day',
      note: 'Viaje a la sierra',
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'demo-3',
      date: formatDate(inThreeDays),
      driver: 'tei',
      slot: 'afternoon',
      note: 'Revisión técnica',
      createdAt: Date.now() - 10800000,
    },
  ];
};

const getLocalBookings = (): Booking[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialLocalBookings();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveLocalBookings = (bookings: Booking[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookings));
    window.dispatchEvent(new Event('horacar-local-update'));
  } catch (err) {
    console.error('Error guardando en local:', err);
  }
};

export const subscribeToBookings = (
  callback: (bookings: Booking[]) => void
): (() => void) => {
  if (isFirebaseConfigured && db) {
    const colRef = collection(db as Firestore, 'bookings');
    const q = query(colRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Booking[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<Booking, 'id'>) });
        });
        callback(items);
      },
      (error) => {
        console.error('Error suscribiendo a Firebase:', error);
        callback(getLocalBookings());
      }
    );

    return unsubscribe;
  }

  // Fallback a LocalStorage con escucha de eventos
  callback(getLocalBookings());

  const handleUpdate = () => {
    callback(getLocalBookings());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('horacar-local-update', handleUpdate);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('horacar-local-update', handleUpdate);
    }
  };
};

export const saveBooking = async (booking: {
  id?: string;
  date: string;
  driver: 'tei' | 'adan';
  slot: 'all_day' | 'morning' | 'afternoon' | 'night';
  note?: string;
}): Promise<void> => {
  const id = booking.id || `${booking.date}_${booking.slot}_${Date.now()}`;
  const record: Booking = {
    id,
    date: booking.date,
    driver: booking.driver,
    slot: booking.slot,
    note: booking.note?.trim() || '',
    createdAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    const docRef = doc(db as Firestore, 'bookings', id);
    await setDoc(docRef, record);
  } else {
    const current = getLocalBookings();
    const existingIndex = current.findIndex((b) => b.id === id);
    let updated: Booking[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = record;
    } else {
      updated = [...current, record];
    }
    saveLocalBookings(updated);
  }

  // Notificar al otro conductor
  const driverName = booking.driver === 'tei' ? 'Tei' : 'Adán';
  const slotLabels: Record<string, string> = {
    all_day: 'Todo el día',
    morning: 'Mañana (08:00 - 14:00)',
    afternoon: 'Tarde (14:00 - 20:00)',
    night: 'Noche (20:00 - 08:00)',
  };

  notifyDriverChange({
    sender: booking.driver,
    title: `${driverName} ha reservado el coche`,
    body: `${booking.date} · ${slotLabels[booking.slot] || booking.slot}${booking.note ? ` (${booking.note})` : ''}`,
    type: 'booking',
  }).catch(() => {});
};

export const getDateRangeArray = (startStr: string, endStr: string): string[] => {
  const dates: string[] = [];
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const curr = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

export const saveBookingRange = async (params: {
  startDate: string;
  endDate: string;
  driver: 'tei' | 'adan';
  slot: 'all_day' | 'morning' | 'afternoon' | 'night';
  note?: string;
}): Promise<void> => {
  const dates = getDateRangeArray(params.startDate, params.endDate);
  if (dates.length === 0) return;

  for (const date of dates) {
    const id = `${date}_${params.slot}_${Date.now()}`;
    const record: Booking = {
      id,
      date,
      driver: params.driver,
      slot: params.slot,
      note: params.note?.trim() || '',
      createdAt: Date.now(),
    };

    if (isFirebaseConfigured && db) {
      const docRef = doc(db as Firestore, 'bookings', id);
      await setDoc(docRef, record);
    } else {
      const current = getLocalBookings();
      saveLocalBookings([...current, record]);
    }
  }

  // Notificar rango
  const driverName = params.driver === 'tei' ? 'Tei' : 'Adán';
  notifyDriverChange({
    sender: params.driver,
    title: `${driverName} ha reservado varios días`,
    body: `Del ${params.startDate} al ${params.endDate}${params.note ? ` (${params.note})` : ''}`,
    type: 'booking',
  }).catch(() => {});
};

export const removeBooking = async (id: string): Promise<void> => {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db as Firestore, 'bookings', id);
    await deleteDoc(docRef);
  } else {
    const current = getLocalBookings();
    const updated = current.filter((b) => b.id !== id);
    saveLocalBookings(updated);
  }

  const sender = getDeviceDriver();
  const driverName = sender === 'tei' ? 'Tei' : 'Adán';
  notifyDriverChange({
    sender,
    title: `${driverName} ha liberado una reserva`,
    body: `Se ha cancelado una franja del coche.`,
    type: 'booking',
  }).catch(() => {});
};
