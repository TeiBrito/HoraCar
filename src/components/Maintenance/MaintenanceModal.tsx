'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Wrench,
  ShieldCheck,
  FileCheck,
  Disc,
  Sliders,
  DollarSign,
  Gauge,
  FileText,
  UserCheck,
  Trash2,
  Check,
} from 'lucide-react';
import {
  MaintenanceItem,
  MaintenanceType,
  MaintenanceResponsible,
  MAINTENANCE_TYPE_INFO,
  DRIVERS,
} from '@/types';
import styles from './maintenanceModal.module.css';

interface MaintenanceModalProps {
  isOpen: boolean;
  itemToEdit?: MaintenanceItem;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    type: MaintenanceType;
    title: string;
    date: string;
    responsible: MaintenanceResponsible;
    kilometers?: number;
    cost?: number;
    notes?: string;
    completed?: boolean;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  itemToEdit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [type, setType] = useState<MaintenanceType>('itv');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [responsible, setResponsible] = useState<MaintenanceResponsible>('tei');
  const [kilometers, setKilometers] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setType(itemToEdit.type);
      setTitle(itemToEdit.title);
      setDate(itemToEdit.date);
      setResponsible(itemToEdit.responsible || 'none');
      setKilometers(itemToEdit.kilometers ? String(itemToEdit.kilometers) : '');
      setCost(itemToEdit.cost ? String(itemToEdit.cost) : '');
      setNotes(itemToEdit.notes || '');
      setCompleted(itemToEdit.completed);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setType('itv');
      setTitle(MAINTENANCE_TYPE_INFO.itv.defaultTitle);
      setDate(today);
      setResponsible('tei');
      setKilometers('');
      setCost('');
      setNotes('');
      setCompleted(false);
    }
  }, [itemToEdit, isOpen]);

  const handleTypeChange = (newType: MaintenanceType) => {
    setType(newType);
    // Auto-update title if it was default or empty
    if (!itemToEdit || title === MAINTENANCE_TYPE_INFO[type].defaultTitle) {
      setTitle(MAINTENANCE_TYPE_INFO[newType].defaultTitle);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: itemToEdit?.id,
        type,
        title: title.trim(),
        date,
        responsible,
        kilometers: kilometers ? Number(kilometers) : undefined,
        cost: cost ? Number(cost) : undefined,
        notes: notes.trim(),
        completed,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToEdit) return;
    setIsSubmitting(true);
    try {
      await onDelete(itemToEdit.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (t: MaintenanceType) => {
    switch (t) {
      case 'itv':
        return <ShieldCheck size={16} />;
      case 'revision':
        return <Wrench size={16} />;
      case 'insurance':
        return <FileCheck size={16} />;
      case 'tires':
        return <Disc size={16} />;
      case 'other':
      default:
        return <Sliders size={16} />;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.headerIcon}>
              <Wrench size={18} />
            </div>
            <div>
              <h3 className={styles.title}>
                {itemToEdit ? 'Editar Mantenimiento' : 'Nueva Fecha / Revisión'}
              </h3>
              <p className={styles.subtitle}>Gestión técnica y puesta a punto del coche</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Type Selector Grid */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Tipo de Registro</label>
            <div className={styles.typeGrid}>
              {(['itv', 'revision', 'insurance', 'tires', 'other'] as MaintenanceType[]).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.typeBtn} ${type === t ? styles.typeBtnActive : ''}`}
                    onClick={() => handleTypeChange(t)}
                  >
                    {getTypeIcon(t)}
                    <span>{MAINTENANCE_TYPE_INFO[t].label}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Title & Date */}
          <div className={styles.rowTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Concepto / Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Pasar ITV, Cambio de aceite..."
                className={styles.textInput}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                <Calendar size={13} />
                <span>Fecha / Cita</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.textInput}
                required
              />
            </div>
          </div>

          {/* Responsible Driver Selector */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <UserCheck size={14} />
              <span>¿Quién se encarga de llevarlo?</span>
            </label>
            <div className={styles.responsibleGrid}>
              <button
                type="button"
                className={`${styles.respBtn} ${responsible === 'tei' ? styles.respTeiActive : ''}`}
                onClick={() => setResponsible('tei')}
              >
                <span className={styles.driverDotTei} />
                <span>Tei</span>
                {responsible === 'tei' && <Check size={14} className={styles.checkIcon} />}
              </button>

              <button
                type="button"
                className={`${styles.respBtn} ${responsible === 'adan' ? styles.respAdanActive : ''}`}
                onClick={() => setResponsible('adan')}
              >
                <span className={styles.driverDotAdan} />
                <span>Adán</span>
                {responsible === 'adan' && <Check size={14} className={styles.checkIcon} />}
              </button>

              <button
                type="button"
                className={`${styles.respBtn} ${responsible === 'both' ? styles.respGenericActive : ''}`}
                onClick={() => setResponsible('both')}
              >
                <span>Ambos</span>
                {responsible === 'both' && <Check size={14} className={styles.checkIcon} />}
              </button>

              <button
                type="button"
                className={`${styles.respBtn} ${responsible === 'none' ? styles.respGenericActive : ''}`}
                onClick={() => setResponsible('none')}
              >
                <span>Por acordar</span>
              </button>
            </div>
          </div>

          {/* Cost & Kilometers */}
          <div className={styles.rowTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                <DollarSign size={13} />
                <span>Coste Estimado (€)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Ej. 45"
                className={styles.textInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                <Gauge size={13} />
                <span>Kilometraje (km)</span>
              </label>
              <input
                type="number"
                min="0"
                value={kilometers}
                onChange={(e) => setKilometers(e.target.value)}
                placeholder="Ej. 120000"
                className={styles.textInput}
              />
            </div>
          </div>

          {/* Notes */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <FileText size={13} />
              <span>Notas / Taller / Teléfono (opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dirección del taller, cita a las 10:30, documentos a llevar..."
              className={styles.textareaInput}
              rows={2}
            />
          </div>

          {/* Completed Checkbox (for editing) */}
          {itemToEdit && (
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxText}>
                Marcar como <strong>Realizado / Completado</strong>
              </span>
            </label>
          )}

          {/* Actions */}
          <div className={styles.actionsRow}>
            {itemToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className={styles.deleteBtn}
              >
                <Trash2 size={15} />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className={styles.mainActions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelBtn}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : itemToEdit ? 'Actualizar' : 'Guardar Registro'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
