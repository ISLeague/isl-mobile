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

interface TimePickerInputProps {
  label?: string;
  value: string; // Format: HH:MM
  onChangeTime: (time: string) => void;
  placeholder?: string;
  error?: string;
}

export const TimePickerInput: React.FC<TimePickerInputProps> = ({
  label,
  value,
  onChangeTime,
  placeholder = 'Seleccionar hora',
  error,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date | null>(null);

  // Parse time from string (HH:MM) or use current time
  const parseTime = (timeString: string): Date => {
    const now = new Date();
    if (!timeString) return now;

    const parts = timeString.split(':');
    if (parts.length === 2) {
      now.setHours(parseInt(parts[0]));
      now.setMinutes(parseInt(parts[1]));
    }
    return now;
  };

  // Format time to HH:MM
  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    // En Android el picker se cierra automáticamente
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedTime) {
        const formattedTime = formatTime(selectedTime);
        onChangeTime(formattedTime);
      }
    } else {
      // En iOS guardamos temporalmente la hora
      if (selectedTime) {
        setTempTime(selectedTime);
      }
    }
  };

  const handleConfirm = () => {
    if (tempTime) {
      const formattedTime = formatTime(tempTime);
      onChangeTime(formattedTime);
    }
    setShowPicker(false);
    setTempTime(null);
  };

  const handleCancel = () => {
    setShowPicker(false);
    setTempTime(null);
  };

  const handleOpen = () => {
    setTempTime(parseTime(value));
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
        <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textLight} />
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textLight} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Android: Picker directo */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={parseTime(value)}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* iOS: Modal con picker */}
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
                <Text style={styles.modalTitle}>Seleccionar Hora</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.modalButtonConfirm}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime || parseTime(value)}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleTimeChange}
                style={styles.picker}
                textColor="#000000"
                themeVariant="light"
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
    backgroundColor: '#FFFFFF',
  },
});
