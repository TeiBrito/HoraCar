'use client';

import React from 'react';
import { BarChart3, Scale, Award, Calendar } from 'lucide-react';
import { Booking, DriverId, DRIVERS } from '@/types';
import styles from './stats.module.css';

interface StatsSummaryProps {
  bookings: Booking[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ bookings }) => {
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filter bookings for current month
  const monthBookings = bookings.filter((b) => b.date.startsWith(currentYearMonth));

  const teiCount = monthBookings.filter((b) => b.driver === 'tei').length;
  const adanCount = monthBookings.filter((b) => b.driver === 'adan').length;
  const total = teiCount + adanCount;

  const teiPercent = total > 0 ? Math.round((teiCount / total) * 100) : 50;
  const adanPercent = total > 0 ? 100 - teiPercent : 50;

  const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Scale size={16} className={styles.icon} />
          <h3 className={styles.title}>Uso mensual ({monthName})</h3>
        </div>
        <span className={styles.totalBadge}>{total} turnos este mes</span>
      </div>

      {/* Split Bar */}
      <div className={styles.barContainer}>
        <div
          className={styles.barTei}
          style={{ width: `${teiPercent}%` }}
          title={`Tei: ${teiCount} turnos (${teiPercent}%)`}
        />
        <div
          className={styles.barAdan}
          style={{ width: `${adanPercent}%` }}
          title={`Adán: ${adanCount} turnos (${adanPercent}%)`}
        />
      </div>

      {/* Driver cards breakdown */}
      <div className={styles.driversGrid}>
        <div className={`${styles.driverCard} ${styles.cardTei}`}>
          <div className={styles.cardHeader}>
            <span className={styles.indicatorTei} />
            <span className={styles.driverName}>Tei</span>
            <span className={styles.percentText}>{teiPercent}%</span>
          </div>
          <div className={styles.cardValue}>
            <span className={styles.countNumber}>{teiCount}</span>
            <span className={styles.countLabel}>días / turnos</span>
          </div>
        </div>

        <div className={`${styles.driverCard} ${styles.cardAdan}`}>
          <div className={styles.cardHeader}>
            <span className={styles.indicatorAdan} />
            <span className={styles.driverName}>Adán</span>
            <span className={styles.percentText}>{adanPercent}%</span>
          </div>
          <div className={styles.cardValue}>
            <span className={styles.countNumber}>{adanCount}</span>
            <span className={styles.countLabel}>días / turnos</span>
          </div>
        </div>
      </div>
    </div>
  );
};
