/**
 * Стандартизированная обработка ошибок API
 */

export interface ApiError {
  detail: string | ApiValidationError[];
  status_code?: number;
}

export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ErrorState {
  message: string;
  validationErrors: Record<string, string>;
}

/**
 * Обрабатывает ошибку API и возвращает стандартизированный формат
 */
export function handleApiError(error: any): ErrorState {
  const result: ErrorState = {
    message: 'Произошла ошибка',
    validationErrors: {}
  };

  if (error.response?.data) {
    const apiError = error.response.data as ApiError;
    
    if (typeof apiError.detail === 'string') {
      result.message = apiError.detail;
    } else if (Array.isArray(apiError.detail)) {
      // Обработка ошибок валидации
      apiError.detail.forEach((err: ApiValidationError) => {
        if (err.loc && err.loc.length > 1) {
          const field = err.loc[err.loc.length - 1] as string;
          result.validationErrors[field] = err.msg;
        }
      });
      
      // Формируем общее сообщение
      if (Object.keys(result.validationErrors).length > 0) {
        result.message = 'Ошибки валидации данных';
      } else {
        result.message = 'Ошибка обработки данных';
      }
    }
  } else if (error.message) {
    result.message = error.message;
  } else if (error.request) {
    result.message = 'Сервер не отвечает. Проверьте подключение к сети.';
  }

  return result;
}

/**
 * Показывает ошибку пользователю (можно заменить на toast)
 */
export function showError(error: ErrorState): void {
  if (Object.keys(error.validationErrors).length > 0) {
    const errorsList = Object.entries(error.validationErrors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join('\n');
    alert(`${error.message}\n\n${errorsList}`);
  } else {
    alert(error.message);
  }
}
