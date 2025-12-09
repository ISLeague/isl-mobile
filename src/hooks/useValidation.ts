import { useState, useCallback } from 'react';

/**
 * Hook personalizado para validaciones de formularios
 * Reutilizable en cualquier componente con validaciones
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string | null;
}

export const useValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Valida un campo específico
   */
  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      const fieldRules = rules[fieldName];
      if (!fieldRules) return null;

      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          return rule.message;
        }
      }
      return null;
    },
    [rules]
  );

  /**
   * Valida todos los campos
   */
  const validateAll = useCallback(
    (values: { [key: string]: any }): boolean => {
      const newErrors: ValidationErrors = {};
      let isValid = true;

      Object.keys(rules).forEach((fieldName) => {
        const error = validateField(fieldName, values[fieldName]);
        if (error) {
          newErrors[fieldName] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [rules, validateField]
  );

  /**
   * Limpia errores
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Limpia error de un campo específico
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
  }, []);

  return {
    errors,
    validateField,
    validateAll,
    clearErrors,
    clearFieldError,
  };
};

// ✅ VALIDADORES COMUNES (reutilizables)

export const Validators = {
  required: (message = 'Este campo es requerido'): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => (value ? value.length >= min : true),
    message: message || `Debe tener al menos ${min} caracteres`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => (value ? value.length <= max : true),
    message: message || `Debe tener máximo ${max} caracteres`,
  }),

  email: (message = 'Email inválido'): ValidationRule => ({
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !value || emailRegex.test(value);
    },
    message,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => !value || regex.test(value),
    message,
  }),

  dateFormat: (message = 'Formato de fecha inválido (YYYY-MM-DD)'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(value);
    },
    message,
  }),

  timeFormat: (message = 'Formato de hora inválido (HH:MM)'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      return timeRegex.test(value);
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      const num = parseFloat(value);
      return isNaN(num) || num >= min;
    },
    message: message || `Debe ser mayor o igual a ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      const num = parseFloat(value);
      return isNaN(num) || num <= max;
    },
    message: message || `Debe ser menor o igual a ${max}`,
  }),

  url: (message = 'URL inválida'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  phone: (message = 'Teléfono inválido'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const phoneRegex = /^[\d\s\+\-\(\)]{8,}$/;
      return phoneRegex.test(value);
    },
    message,
  }),

  numeric: (message = 'Debe ser un número válido'): ValidationRule => ({
    validate: (value) => !value || !isNaN(parseFloat(value)),
    message,
  }),

  custom: (validateFn: (value: any) => boolean, message: string): ValidationRule => ({
    validate: validateFn,
    message,
  }),
};

// 📝 EJEMPLO DE USO:
/*
const MyForm = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [edad, setEdad] = useState('');

  const { errors, validateAll } = useValidation({
    nombre: [
      Validators.required(),
      Validators.minLength(3),
      Validators.maxLength(50),
    ],
    email: [
      Validators.required(),
      Validators.email(),
    ],
    edad: [
      Validators.numeric(),
      Validators.min(18, 'Debes ser mayor de 18 años'),
    ],
  });

  const handleSubmit = () => {
    const isValid = validateAll({ nombre, email, edad });
    if (isValid) {
      // Procesar formulario
    } else {
      Alert.alert('Error', 'Por favor corrige los errores');
    }
  };

  return (
    <>
      <TextInput value={nombre} onChangeText={setNombre} />
      {errors.nombre && <Text style={styles.error}>{errors.nombre}</Text>}
    </>
  );
};
*/
