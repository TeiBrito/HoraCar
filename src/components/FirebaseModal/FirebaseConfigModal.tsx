'use client';

import React, { useState } from 'react';
import { X, Database, Check, Copy, ExternalLink, ShieldCheck, Info } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const envTemplate = `# Variables para tu archivo .env.local o Configuración en Vercel
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Database size={18} />
            <h3 className={styles.title}>Sincronización con Google Firebase</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={`${styles.statusCard} ${isCloudConnected ? styles.statusOnline : styles.statusOffline}`}>
            {isCloudConnected ? (
              <>
                <ShieldCheck size={18} className={styles.statusIcon} />
                <div>
                  <strong>Conectado a Firebase Firestore</strong>
                  <p>Tus reservas se sincronizan en tiempo real entre todos los dispositivos.</p>
                </div>
              </>
            ) : (
              <>
                <Info size={18} className={styles.statusIcon} />
                <div>
                  <strong>Modo de prueba local activo</strong>
                  <p>Los datos se guardan en tu navegador actual. Para sincronizar en vivo con Adán desde Vercel, vincula tu proyecto Firebase.</p>
                </div>
              </>
            )}
          </div>

          <div className={styles.steps}>
            <h4 className={styles.stepsTitle}>Pasos para conectar Firebase (gratis):</h4>
            <ol className={styles.stepsList}>
              <li>
                Entra en{' '}
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  Firebase Console <ExternalLink size={12} />
                </a>{' '}
                y pulsa en <strong>Crear un proyecto</strong>.
              </li>
              <li>
                En el menú lateral, entra en <strong>Firestore Database</strong> y pulsa en <strong>Crear base de datos</strong> (modo de producción o prueba).
              </li>
              <li>
                En la configuración del proyecto (ícono de engranaje), añade una <strong>App Web</strong> y copia las credenciales en tu archivo <code>.env.local</code> (o en las variables de entorno de Vercel).
              </li>
            </ol>
          </div>

          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>
              <span>Plantilla de Variables de Entorno</span>
              <button onClick={handleCopy} className={styles.copyBtn}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <pre className={styles.preCode}>{envTemplate}</pre>
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
