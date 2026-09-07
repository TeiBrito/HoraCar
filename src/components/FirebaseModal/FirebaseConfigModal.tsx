'use client';

import React from 'react';
import { X, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';
import styles from './firebaseModal.module.css';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  isCloudConnected: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  isCloudConnected,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Database size={18} />
            <h3 className={styles.title}>Estado de Google Firebase</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={`${styles.statusCard} ${styles.statusOnline}`}>
            <ShieldCheck size={20} className={styles.statusIcon} />
            <div>
              <strong>Conectado a Firebase Cloud Firestore</strong>
              <p>Proyecto vinculado: <code>horacar-494d1</code></p>
              <p>Tus reservas y avisos se sincronizan automáticamente en tiempo real entre todos los dispositivos.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80' }}>
              <CheckCircle2 size={16} />
              <span>Base de datos en la nube activa</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80' }}>
              <CheckCircle2 size={16} />
              <span>Suscripción en tiempo real (onSnapshot)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80' }}>
              <CheckCircle2 size={16} />
              <span>Firebase Cloud Messaging (Web Push)</span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.doneBtn}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
