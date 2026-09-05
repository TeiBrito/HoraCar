'use client';

import React from 'react';
import {
  Calendar as CalendarIcon,
  Wrench,
  ListFilter,
  Database,
} from 'lucide-react';
import { DriverId } from '@/types';
import styles from './header.module.css';

interface HeaderProps {
  isCloudConnected: boolean;
  activeView: 'calendar' | 'maintenance';
  onViewChange: (view: 'calendar' | 'maintenance') => void;
  filterDriver: DriverId | 'all';
  onFilterChange: (driver: DriverId | 'all') => void;
  onOpenFirebaseConfig: () => void;
  pendingMaintenanceCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isCloudConnected,
  activeView,
  onViewChange,
  filterDriver,
  onFilterChange,
  onOpenFirebaseConfig,
  pendingMaintenanceCount,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <div className={styles.brand}>
          <div className={styles.brandIconWrapper}>
            <img
              src="/logo.jpg"
              alt="HoraCar Vintage Logo"
              className={styles.brandLogoImg}
            />
          </div>
          <div>
            <h1 className={styles.title}>HoraCar</h1>
            <p className={styles.subtitle}>Coordinación & Mantenimiento</p>
          </div>
        </div>

        <button
          onClick={onOpenFirebaseConfig}
          className={`${styles.syncBadge} ${isCloudConnected ? styles.syncOnline : styles.syncOffline}`}
          title="Configuración de sincronización en tiempo real"
        >
          {isCloudConnected ? (
            <>
              <span className={styles.statusDot} />
              <span>Firebase Nube</span>
            </>
          ) : (
            <>
              <Database size={13} />
              <span>Modo Local (Configurar Nube)</span>
            </>
          )}
        </button>
      </div>

      {/* Main View Switcher & Filters Row */}
      <div className={styles.bottomRow}>
        <div className={styles.navTabs}>
          <button
            className={`${styles.navTabBtn} ${activeView === 'calendar' ? styles.navTabActive : ''}`}
            onClick={() => onViewChange('calendar')}
          >
            <CalendarIcon size={15} />
            <span>Turnos y Calendario</span>
          </button>
          <button
            className={`${styles.navTabBtn} ${activeView === 'maintenance' ? styles.navTabActive : ''}`}
            onClick={() => onViewChange('maintenance')}
          >
            <Wrench size={15} />
            <span>Mantenimiento & ITV</span>
            {pendingMaintenanceCount > 0 && (
              <span className={styles.maintAlertCount}>{pendingMaintenanceCount}</span>
            )}
          </button>
        </div>

        {activeView === 'calendar' && (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>
              <ListFilter size={14} />
              <span>Ver:</span>
            </span>
            <button
              className={`${styles.filterBtn} ${filterDriver === 'all' ? styles.filterActive : ''}`}
              onClick={() => onFilterChange('all')}
            >
              Todos
            </button>
            <button
              className={`${styles.filterBtn} ${styles.filterTei} ${filterDriver === 'tei' ? styles.filterActiveTei : ''}`}
              onClick={() => onFilterChange('tei')}
            >
              <span className={styles.indicatorTei} />
              Tei
            </button>
            <button
              className={`${styles.filterBtn} ${styles.filterAdan} ${filterDriver === 'adan' ? styles.filterActiveAdan : ''}`}
              onClick={() => onFilterChange('adan')}
            >
              <span className={styles.indicatorAdan} />
              Adán
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
