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
    accentColor: 'var(--tei-accent)',
    textColor: 'var(--tei-text)',
    avatarBg: '#1e293b',
    avatarText: '#f8fafc',
  },
  adan: {
    id: 'adan',
    name: 'Adán',
    shortName: 'A',
    badgeColor: 'var(--color-driver-adan-badge)',
    accentColor: 'var(--adan-accent)',
    textColor: 'var(--adan-text)',
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

export type MaintenanceType = 'itv' | 'revision' | 'insurance' | 'tires' | 'other';
export type MaintenanceResponsible = 'tei' | 'adan' | 'both' | 'none';

export interface MaintenanceItem {
  id: string;
  type: MaintenanceType;
  title: string;
  date: string; // YYYY-MM-DD (fecha límite o cita)
  responsible: MaintenanceResponsible; // Quién se encarga
  kilometers?: number;
  cost?: number;
  notes?: string;
  completed: boolean;
  createdAt: number;
}

export const MAINTENANCE_TYPE_INFO: Record<
  MaintenanceType,
  { label: string; defaultTitle: string; iconName: string }
> = {
  itv: {
    label: 'ITV',
    defaultTitle: 'Inspección Técnica ITV',
    iconName: 'ShieldCheck',
  },
  revision: {
    label: 'Revisión / Taller',
    defaultTitle: 'Revisión de Aceite y Filtros',
    iconName: 'Wrench',
  },
  insurance: {
    label: 'Seguro',
    defaultTitle: 'Renovación de Póliza',
    iconName: 'FileCheck',
  },
  tires: {
    label: 'Neumáticos',
    defaultTitle: 'Revisión / Cambio de Ruedas',
    iconName: 'Disc',
  },
  other: {
    label: 'Varios',
    defaultTitle: 'Mantenimiento General',
    iconName: 'Sliders',
  },
};

export interface FuelTurnState {
  currentDriver: DriverId; // 'tei' | 'adan'
  lastRefueledAt?: string; // Fecha en que se echó por última vez
  lastRefueledBy?: DriverId;
}

