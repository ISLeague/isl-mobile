import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface DatePickerInputProps {
  label?: string;
  value: string; // Format: YYYY-MM-DD
  onChangeDate: (date: string) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChangeDate,
  placeholder = 'Seleccionar fecha',
  error,
  minimumDate,
  maximumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [internalDate, setInternalDate] = useState<Date>(new Date());

  // Parse date from string (YYYY-MM-DD) or use today
  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Usar constructor local seguro
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return date;
      }
    } catch (e) {
      // Fallback
    }
    return new Date();
  };

  // Format date to YYYY-MM-DD (Safe local format)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for display (DD/MM/YYYY)
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const d = parts[2].split('T')[0]; // Safe guard for potential ISO leftovers
        return `${d}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) { }
    return dateString;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        const formattedDate = formatDate(selectedDate);
        onChangeDate(formattedDate);
      }
    } else {
      // iOS
      if (selectedDate) {
        setInternalDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    const formattedDate = formatDate(internalDate);
    onChangeDate(formattedDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handleOpen = () => {
    setInternalDate(parseDate(value));
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.inputContainer, error && styles.inputContainerError]}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="calendar" size={20} color={colors.textLight} />
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textLight} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Android: Picker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={internalDate}
          mode="date"
          display="calendar"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* iOS: Picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
        >
          <Pressable style={styles.modalOverlay} onPress={handleCancel}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.modalButtonCancel}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Fecha</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.modalButtonConfirm}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={internalDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.picker}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textLight,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalButtonCancel: {
    fontSize: 17,
    color: colors.error,
  },
  modalButtonConfirm: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  picker: {
    height: 200,
  },
});
