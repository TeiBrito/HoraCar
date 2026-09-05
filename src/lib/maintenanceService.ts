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
import { MaintenanceItem } from '@/types';

const LOCAL_STORAGE_MAINTENANCE_KEY = 'horacar_maintenance_v1';

const getInitialMaintenance = (): MaintenanceItem[] => {
  const today = new Date();
  const format = (d: Date) => d.toISOString().split('T')[0];

  const inOneMonth = new Date(today);
  inOneMonth.setDate(today.getDate() + 28);

  const inThreeMonths = new Date(today);
  inThreeMonths.setDate(today.getDate() + 85);

  return [
    {
      id: 'maint-1',
      type: 'itv',
      title: 'Pasar ITV Anual',
      date: format(inOneMonth),
      responsible: 'tei',
      cost: 45,
      notes: 'Estación ITV de Alcobendas. Llevar ficha técnica y recibo del seguro.',
      completed: false,
      createdAt: Date.now() - 500000,
    },
    {
      id: 'maint-2',
      type: 'revision',
      title: 'Cambio de Aceite y Filtros',
      date: format(inThreeMonths),
      responsible: 'adan',
      kilometers: 125000,
      cost: 120,
      notes: 'Taller Hermanos García. Comprobar también pastillas de freno delanteras.',
      completed: false,
      createdAt: Date.now() - 1000000,
    },
  ];
};

const getLocalMaintenance = (): MaintenanceItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MAINTENANCE_KEY);
    if (!raw) {
      const initial = getInitialMaintenance();
      localStorage.setItem(LOCAL_STORAGE_MAINTENANCE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveLocalMaintenance = (items: MaintenanceItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_MAINTENANCE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('horacar-maintenance-update'));
  } catch (err) {
    console.error('Error guardando mantenimiento en local:', err);
  }
};

export const subscribeToMaintenance = (
  callback: (items: MaintenanceItem[]) => void
): (() => void) => {
  if (isFirebaseConfigured && db) {
    const colRef = collection(db as Firestore, 'maintenance');
    const q = query(colRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: MaintenanceItem[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as Omit<MaintenanceItem, 'id'>) });
        });
        callback(items);
      },
      (error) => {
        console.error('Error suscribiendo a Firebase mantenimiento:', error);
        callback(getLocalMaintenance());
      }
    );

    return unsubscribe;
  }

  // Fallback local
  callback(getLocalMaintenance());

  const handleUpdate = () => {
    callback(getLocalMaintenance());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('horacar-maintenance-update', handleUpdate);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('horacar-maintenance-update', handleUpdate);
    }
  };
};

export const saveMaintenance = async (item: {
  id?: string;
  type: MaintenanceItem['type'];
  title: string;
  date: string;
  responsible: MaintenanceItem['responsible'];
  kilometers?: number;
  cost?: number;
  notes?: string;
  completed?: boolean;
}): Promise<void> => {
  const id = item.id || `maint_${item.type}_${Date.now()}`;
  const record: MaintenanceItem = {
    id,
    type: item.type,
    title: item.title.trim(),
    date: item.date,
    responsible: item.responsible || 'none',
    kilometers: item.kilometers || undefined,
    cost: item.cost || undefined,
    notes: item.notes?.trim() || '',
    completed: item.completed ?? false,
    createdAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    const docRef = doc(db as Firestore, 'maintenance', id);
    await setDoc(docRef, record);
    return;
  }

  const current = getLocalMaintenance();
  const existingIndex = current.findIndex((m) => m.id === id);
  let updated: MaintenanceItem[];

  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = record;
  } else {
    updated = [...current, record];
  }

  saveLocalMaintenance(updated);
};

export const toggleMaintenanceCompleted = async (
  id: string,
  completed: boolean
): Promise<void> => {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db as Firestore, 'maintenance', id);
    await setDoc(docRef, { completed }, { merge: true });
    return;
  }

  const current = getLocalMaintenance();
  const updated = current.map((m) => (m.id === id ? { ...m, completed } : m));
  saveLocalMaintenance(updated);
};

export const removeMaintenance = async (id: string): Promise<void> => {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db as Firestore, 'maintenance', id);
    await deleteDoc(docRef);
    return;
  }

  const current = getLocalMaintenance();
  const updated = current.filter((m) => m.id !== id);
  saveLocalMaintenance(updated);
};
