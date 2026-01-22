/**
 * Утилиты для валидации форм
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

/**
 * Валидирует значение по правилам
 */
export function validateField(value: any, rule: ValidationRule): string | null {
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'Это поле обязательно для заполнения';
  }

  if (value && typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return `Минимальная длина: ${rule.minLength} символов`;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return `Максимальная длина: ${rule.maxLength} символов`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return 'Неверный формат данных';
    }
  }

  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
}

/**
 * Валидирует объект данных по правилам
 */
export function validateForm(data: Record<string, any>, rules: ValidationRules): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const error = validateField(value, rule);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

/**
 * Правила валидации для проекта
 */
export const projectValidationRules: ValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  code: {
    maxLength: 50,
    pattern: /^[A-Z0-9-]*$/i
  },
  customer: {
    maxLength: 200
  },
  contractor: {
    maxLength: 200
  },
  address: {
    maxLength: 500
  },
  description: {
    maxLength: 2000
  },
  start_date: {
    custom: (value) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Неверный формат даты';
        }
      }
      return null;
    }
  },
  end_date: {
    custom: (value) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Неверный формат даты';
        }
      }
      return null;
    }
  }
};
