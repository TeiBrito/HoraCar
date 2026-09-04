'use client';

import React from 'react';
import { Car, Radio, ShieldCheck, Database, Calendar as CalendarIcon, ListFilter } from 'lucide-react';
import { DriverId } from '@/types';
import styles from './header.module.css';

interface HeaderProps {
  isCloudConnected: boolean;
  filterDriver: DriverId | 'all';
  onFilterChange: (driver: DriverId | 'all') => void;
  onOpenFirebaseConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isCloudConnected,
  filterDriver,
  onFilterChange,
  onOpenFirebaseConfig,
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
            <p className={styles.subtitle}>Coordinación de vehículo</p>
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

      <div className={styles.filterRow}>
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
      </div>
    </header>
  );
};
