export type DriverId = 'tei' | 'adan';

export type TimeSlot = 'all_day' | 'morning' | 'afternoon' | 'night';

export interface DriverInfo {
  id: DriverId;
  name: string;
  shortName: string;
  badgeColor: string;
  accentColor: string;
  textColor: string;
  avatarBg: string;
  avatarText: string;
}

export const DRIVERS: Record<DriverId, DriverInfo> = {
  tei: {
    id: 'tei',
    name: 'Tei',
    shortName: 'T',
    badgeColor: 'var(--color-driver-tei-badge)',
    accentColor: 'var(--color-driver-tei)',
    textColor: 'var(--color-driver-tei-text)',
    avatarBg: '#1e293b',
    avatarText: '#f8fafc',
  },
  adan: {
    id: 'adan',
    name: 'Adán',
    shortName: 'A',
    badgeColor: 'var(--color-driver-adan-badge)',
    accentColor: 'var(--color-driver-adan)',
    textColor: 'var(--color-driver-adan-text)',
    avatarBg: '#0f172a',
    avatarText: '#f8fafc',
  },
};

export const TIME_SLOT_LABELS: Record<TimeSlot, { label: string; desc: string }> = {
  all_day: { label: 'Día Completo', desc: 'Jornada entera' },
  morning: { label: 'Mañana', desc: '07:00 – 14:00' },
  afternoon: { label: 'Tarde', desc: '14:00 – 20:00' },
  night: { label: 'Noche', desc: '20:00 – Madrugada' },
};

export interface Booking {
  id: string;
  date: string; // YYYY-MM-DD
  driver: DriverId;
  slot: TimeSlot;
  note?: string;
  createdAt: number;
}
