'use client';

import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  FileCheck,
  Disc,
  Sliders,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Clock,
  DollarSign,
  Gauge,
  Edit2,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  MaintenanceItem,
  MaintenanceType,
  MaintenanceResponsible,
  MAINTENANCE_TYPE_INFO,
  DRIVERS,
} from '@/types';
import styles from './maintenance.module.css';

interface MaintenanceSectionProps {
  items: MaintenanceItem[];
  onAddNew: () => void;
  onEdit: (item: MaintenanceItem) => void;
  onToggleCompleted: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export const MaintenanceSection: React.FC<MaintenanceSectionProps> = ({
  items,
  onAddNew,
  onEdit,
  onToggleCompleted,
  onDelete,
}) => {
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');

  const pendingItems = items
    .filter((i) => !i.completed)
    .sort((a, b) => a.date.localeCompare(b.date));

  const completedItems = items
    .filter((i) => i.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  const displayedItems = tab === 'pending' ? pendingItems : completedItems;

  const todayStr = new Date().toISOString().split('T')[0];

  const getDaysDiff = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyBadge = (dateStr: string, completed: boolean) => {
    if (completed) {
      return <span className={styles.badgeDone}>Completado</span>;
    }

    const diff = getDaysDiff(dateStr);

    if (diff < 0) {
      return (
        <span className={styles.badgeOverdue}>
          <AlertCircle size={12} />
          <span>Vencido ({Math.abs(diff)}d)</span>
        </span>
      );
    }
    if (diff === 0) {
      return (
        <span className={styles.badgeToday}>
          <Clock size={12} />
          <span>¡Hoy!</span>
        </span>
      );
    }
    if (diff <= 14) {
      return (
        <span className={styles.badgeSoon}>
          <Clock size={12} />
          <span>En {diff} días</span>
        </span>
      );
    }
    if (diff <= 60) {
      return (
        <span className={styles.badgeNormal}>
          <span>En {diff} días</span>
        </span>
      );
    }
    const months = Math.round(diff / 30);
    return (
      <span className={styles.badgeNormal}>
        <span>En ~{months} meses</span>
      </span>
    );
  };

  const getTypeIcon = (type: MaintenanceType) => {
    switch (type) {
      case 'itv':
        return <ShieldCheck size={18} />;
      case 'revision':
        return <Wrench size={18} />;
      case 'insurance':
        return <FileCheck size={18} />;
      case 'tires':
        return <Disc size={18} />;
      case 'other':
      default:
        return <Sliders size={18} />;
    }
  };

  const formatFriendlyDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderResponsibleBadge = (resp: MaintenanceResponsible) => {
    if (resp === 'tei') {
      return (
        <span className={styles.respBadgeTei}>
          <span className={styles.dotTei} />
          <span>Lleva: Tei</span>
        </span>
      );
    }
    if (resp === 'adan') {
      return (
        <span className={styles.respBadgeAdan}>
          <span className={styles.dotAdan} />
          <span>Lleva: Adán</span>
        </span>
      );
    }
    if (resp === 'both') {
      return (
        <span className={styles.respBadgeGeneric}>
          <span>Llevan: Ambos</span>
        </span>
      );
    }
    return (
      <span className={styles.respBadgeMuted}>
        <span>Encargado: Por acordar</span>
      </span>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Mantenimiento y Fechas Clave</h3>
          <p className={styles.subtitle}>ITV, revisiones de taller, seguro y puesta a punto</p>
        </div>
        <button onClick={onAddNew} className={styles.addBtn}>
          <Plus size={15} strokeWidth={2.4} />
          <span>Añadir Registro</span>
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        <button
          className={`${styles.tabBtn} ${tab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => setTab('pending')}
        >
          <span>Pendientes</span>
          <span className={styles.tabCount}>{pendingItems.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${tab === 'completed' ? styles.tabActive : ''}`}
          onClick={() => setTab('completed')}
        >
          <span>Historial / Realizados</span>
          <span className={styles.tabCount}>{completedItems.length}</span>
        </button>
      </div>

      {/* List */}
      {displayedItems.length === 0 ? (
        <div className={styles.emptyState}>
          <Wrench size={26} className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            {tab === 'pending'
              ? 'Todo al día. No hay revisiones ni ITV pendientes.'
              : 'No hay registros en el historial de mantenimiento.'}
          </p>
          {tab === 'pending' && (
            <button onClick={onAddNew} className={styles.emptyActionBtn}>
              Registrar próxima ITV o revisión
            </button>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {displayedItems.map((item) => (
            <div
              key={item.id}
              className={`${styles.card} ${item.completed ? styles.cardCompleted : ''}`}
            >
              {/* Left Type Icon & Checkbox */}
              <div className={styles.leftCol}>
                <button
                  className={styles.completeToggle}
                  onClick={() => onToggleCompleted(item.id, !item.completed)}
                  title={item.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                >
                  {item.completed ? (
                    <CheckCircle2 size={20} className={styles.iconChecked} />
                  ) : (
                    <Circle size={20} className={styles.iconUnchecked} />
                  )}
                </button>
                <div className={styles.typeIconWrapper}>{getTypeIcon(item.type)}</div>
              </div>

              {/* Main Content */}
              <div className={styles.contentCol}>
                <div className={styles.topLine}>
                  <h4 className={styles.itemTitle}>{item.title}</h4>
                  {getUrgencyBadge(item.date, item.completed)}
                </div>

                <div className={styles.metaLine}>
                  <span className={styles.metaItem}>
                    <Calendar size={13} />
                    <span>{formatFriendlyDate(item.date)}</span>
                  </span>

                  {renderResponsibleBadge(item.responsible)}

                  {item.cost && (
                    <span className={styles.metaItem}>
                      <DollarSign size={13} />
                      <span>{item.cost} €</span>
                    </span>
                  )}

                  {item.kilometers && (
                    <span className={styles.metaItem}>
                      <Gauge size={13} />
                      <span>{item.kilometers.toLocaleString()} km</span>
                    </span>
                  )}
                </div>

                {item.notes && <p className={styles.notesText}>{item.notes}</p>}
              </div>

              {/* Actions */}
              <div className={styles.actionsCol}>
                <button
                  className={styles.actionBtn}
                  onClick={() => onEdit(item)}
                  title="Editar registro"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.actionDelete}`}
                  onClick={() => onDelete(item.id)}
                  title="Eliminar registro"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
