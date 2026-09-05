'use client';

import React, { useState } from 'react';
import { Fuel, Check, ArrowRightLeft } from 'lucide-react';
import { FuelTurnState, DriverId, DRIVERS } from '@/types';
import styles from './fuelToggle.module.css';

interface FuelToggleWidgetProps {
  fuelState: FuelTurnState;
  onSetDriver: (driver: DriverId) => Promise<void>;
  onToggleTurn: () => Promise<void>;
}

export const FuelToggleWidget: React.FC<FuelToggleWidgetProps> = ({
  fuelState,
  onSetDriver,
  onToggleTurn,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const currentDriver = fuelState.currentDriver || 'tei';
  const isTei = currentDriver === 'tei';

  const handleSelect = async (driver: DriverId) => {
    if (driver === currentDriver || isUpdating) return;
    setIsUpdating(true);
    try {
      await onSetDriver(driver);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkRefueled = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onToggleTurn();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const nextDriverName = isTei ? DRIVERS.adan.name : DRIVERS.tei.name;
  const currentDriverName = DRIVERS[currentDriver].name;

  return (
    <div className={styles.widgetContainer}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.fuelIconWrapper}>
            <Fuel size={16} />
          </div>
          <div>
            <h4 className={styles.title}>Turno de Gasolina</h4>
            <p className={styles.subtitle}>¿A quién le toca repostar?</p>
          </div>
        </div>
      </div>

      {/* Tactile Switch */}
      <div className={styles.switchWrapper}>
        <div className={styles.switchTrack}>
          {/* Background Sliding Highlight */}
          <div
            className={`${styles.activeBackgroundSlider} ${
              isTei ? styles.sliderTei : styles.sliderAdan
            }`}
          />

          {/* Tei Option */}
          <button
            type="button"
            className={`${styles.driverButton} ${isTei ? styles.activeDriverTei : ''}`}
            onClick={() => handleSelect('tei')}
            disabled={isUpdating}
          >
            <span className={styles.driverDotTei} />
            <span className={styles.driverName}>Tei</span>
            {isTei && (
              <span className={styles.fuelBadgeTei} title="Le toca repostar a Tei">
                <Fuel size={13} strokeWidth={2.4} />
              </span>
            )}
          </button>

          {/* Adán Option */}
          <button
            type="button"
            className={`${styles.driverButton} ${!isTei ? styles.activeDriverAdan : ''}`}
            onClick={() => handleSelect('adan')}
            disabled={isUpdating}
          >
            <span className={styles.driverDotAdan} />
            <span className={styles.driverName}>Adán</span>
            {!isTei && (
              <span className={styles.fuelBadgeAdan} title="Le toca repostar a Adán">
                <Fuel size={13} strokeWidth={2.4} />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status & Quick Action */}
      <div className={styles.statusFooter}>
        <div className={styles.statusText}>
          <span>Próximo en repostar: </span>
          <strong className={isTei ? styles.teiHighlight : styles.adanHighlight}>
            {currentDriverName}
          </strong>
        </div>

        <button
          type="button"
          onClick={handleMarkRefueled}
          disabled={isUpdating}
          className={styles.passTurnBtn}
          title={`Marcar que ${currentDriverName} ya ha repostado`}
        >
          <ArrowRightLeft size={13} />
          <span>He repostado (pasar a {nextDriverName})</span>
          <Fuel size={13} className={styles.btnRightIcon} />
        </button>
      </div>
    </div>
  );
};
