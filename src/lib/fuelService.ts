import { doc, onSnapshot, setDoc, Firestore } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { FuelTurnState, DriverId } from '@/types';
import { notifyDriverChange } from './notificationsService';

const LOCAL_STORAGE_FUEL_KEY = 'horacar_fuel_turn_v1';

const getInitialFuelState = (): FuelTurnState => {
  return {
    currentDriver: 'tei',
    lastRefueledAt: new Date().toISOString().split('T')[0],
    lastRefueledBy: 'adan',
  };
};

const getLocalFuelState = (): FuelTurnState => {
  if (typeof window === 'undefined') return getInitialFuelState();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FUEL_KEY);
    if (!raw) {
      const initial = getInitialFuelState();
      localStorage.setItem(LOCAL_STORAGE_FUEL_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialFuelState();
  }
};

const saveLocalFuelState = (state: FuelTurnState) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_FUEL_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('horacar-fuel-update'));
  } catch (err) {
    console.error('Error guardando turno de gasolina en local:', err);
  }
};

export const subscribeToFuelTurn = (
  callback: (state: FuelTurnState) => void
): (() => void) => {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db as Firestore, 'settings', 'fuel_turn');

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as FuelTurnState);
        } else {
          // Inicializar si no existe en Firebase
          const initial = getInitialFuelState();
          setDoc(docRef, initial);
          callback(initial);
        }
      },
      (error) => {
        console.error('Error suscribiendo a turno de gasolina en Firebase:', error);
        callback(getLocalFuelState());
      }
    );

    return unsubscribe;
  }

  // Fallback local
  callback(getLocalFuelState());

  const handleUpdate = () => {
    callback(getLocalFuelState());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('horacar-fuel-update', handleUpdate);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('horacar-fuel-update', handleUpdate);
    }
  };
};

export const setFuelDriver = async (driver: DriverId): Promise<void> => {
  const refueledBy = driver === 'tei' ? 'adan' : 'tei';
  const newState: FuelTurnState = {
    currentDriver: driver,
    lastRefueledAt: new Date().toISOString().split('T')[0],
    lastRefueledBy: refueledBy,
  };

  if (isFirebaseConfigured && db) {
    const docRef = doc(db as Firestore, 'settings', 'fuel_turn');
    await setDoc(docRef, newState, { merge: true });
  } else {
    saveLocalFuelState(newState);
  }

  const senderName = refueledBy === 'tei' ? 'Tei' : 'Adán';
  const targetName = driver === 'tei' ? 'Tei' : 'Adán';

  notifyDriverChange({
    sender: refueledBy,
    title: `Cambio de Turno de Gasolina`,
    body: `${senderName} repostó. Ahora le toca pagar gasolina a ${targetName}.`,
    type: 'fuel',
  }).catch(() => {});
};

export const toggleFuelTurn = async (currentState: FuelTurnState): Promise<void> => {
  const nextDriver: DriverId = currentState.currentDriver === 'tei' ? 'adan' : 'tei';
  await setFuelDriver(nextDriver);
};
