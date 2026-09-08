'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, BellRing, Smartphone, ShieldCheck, AlertCircle, Send, Check } from 'lucide-react';
import { DriverId } from '@/types';
import {
  registerDeviceForPush,
  unregisterDevicePush,
  getDeviceDriver,
  setDeviceDriver,
  getNotificationPermissionStatus,
  notifyDriverChange,
  PushPermissionStatus,
} from '@/lib/notificationsService';
import styles from './notificationsModal.module.css';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [selectedDriver, setSelectedDriver] = useState<DriverId>('tei');
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('default');
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [testSent, setTestSent] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedDriver(getDeviceDriver());
      setPermissionStatus(getNotificationPermissionStatus());
      setMessage(null);
      setTestSent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectDriver = (driver: DriverId) => {
    setSelectedDriver(driver);
    setDeviceDriver(driver);
  };

  const handleActivate = async () => {
    setIsActivating(true);
    setMessage(null);

    const res = await registerDeviceForPush(selectedDriver);
    setIsActivating(false);
    setPermissionStatus(getNotificationPermissionStatus());

    if (res.success) {
      setMessage(`Notificaciones activadas para ${selectedDriver === 'tei' ? 'Tei' : 'Adán'}.`);
      if (onStatusChange) onStatusChange();
    } else {
      setMessage(res.error || 'No se pudo activar las notificaciones.');
    }
  };

  const handleSendTest = async () => {
    setTestSent(true);
    const driverName = selectedDriver === 'tei' ? 'Tei' : 'Adán';

    try {
      // Disparar aviso push real desde el servidor hacia este dispositivo
      await notifyDriverChange({
        sender: selectedDriver,
        targetDriver: selectedDriver,
        title: `HoraCar: Prueba de aviso (${driverName})`,
        body: `El sistema de notificaciones push de HoraCar está conectado y funcionando correctamente.`,
        type: 'test',
      });
      setMessage(`Aviso push de prueba enviado al dispositivo.`);
    } catch {
      setMessage(`Error enviando aviso de prueba.`);
    }

    setTimeout(() => setTestSent(false), 3500);
  };

  const isGranted = permissionStatus === 'granted';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Bell size={18} />
            <h3 className={styles.title}>Notificaciones Push en Vivo</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Status Box */}
          <div className={`${styles.statusCard} ${isGranted ? styles.statusOnline : styles.statusOffline}`}>
            {isGranted ? (
              <>
                <ShieldCheck size={18} className={styles.statusIcon} />
                <div>
                  <strong>Avisos automáticos activados</strong>
                  <p>
                    Recibirás un aviso en este dispositivo cada vez que {selectedDriver === 'tei' ? 'Adán' : 'Tei'} reserve el coche, cambie el turno de gasolina o añada una ITV.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={18} className={styles.statusIcon} />
                <div>
                  <strong>Avisos pendientes de activar</strong>
                  <p>
                    Activa los permisos del navegador para enterarte en tiempo real sin necesidad de tener la app abierta.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Driver identity */}
          <div className={styles.driverSelection}>
            <span className={styles.sectionLabel}>¿De quién es este teléfono / navegador?</span>
            <div className={styles.driverButtons}>
              <button
                type="button"
                className={`${styles.driverBtn} ${selectedDriver === 'tei' ? styles.driverBtnActiveTei : ''}`}
                onClick={() => handleSelectDriver('tei')}
              >
                <span className={styles.dotTei} />
                <span>Soy Tei</span>
              </button>
              <button
                type="button"
                className={`${styles.driverBtn} ${selectedDriver === 'adan' ? styles.driverBtnActiveAdan : ''}`}
                onClick={() => handleSelectDriver('adan')}
              >
                <span className={styles.dotAdan} />
                <span>Soy Adán</span>
              </button>
            </div>
          </div>

          {/* Explanation */}
          <div className={styles.infoBox}>
            <p>
              Al activar las notificaciones, tu móvil registrará su clave segura en Firebase. Cuando hagas un cambio, la app le avisará automáticamente al otro conductor.
            </p>
          </div>

          {message && (
            <div style={{ fontSize: '13px', color: isGranted ? '#4ade80' : '#fbbf24', textAlign: 'center' }}>
              {message}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleActivate}
              disabled={isActivating}
              className={styles.activateBtn}
            >
              {isActivating ? (
                <span>Conectando con Firebase...</span>
              ) : isGranted ? (
                <>
                  <Check size={16} />
                  <span>Re-sincronizar permisos</span>
                </>
              ) : (
                <>
                  <BellRing size={16} />
                  <span>Activar Notificaciones en este móvil</span>
                </>
              )}
            </button>

            {isGranted && (
              <button
                type="button"
                onClick={handleSendTest}
                disabled={testSent}
                className={styles.testBtn}
              >
                {testSent ? <Check size={14} /> : <Send size={14} />}
                <span>{testSent ? 'Aviso enviado' : 'Lanzar notificación de prueba'}</span>
              </button>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.doneBtn}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
