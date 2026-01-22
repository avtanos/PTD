/**
 * Нормализует данные API в массив
 * Обрабатывает случаи, когда API возвращает объект с числовыми ключами вместо массива
 */
export function normalizeToArray<T>(data: any): T[] {
  // Если это уже массив, возвращаем как есть
  if (Array.isArray(data)) {
    return data;
  }
  
  // Если это объект, пытаемся преобразовать в массив
  if (data && typeof data === 'object') {
    const values = Object.values(data);
    // Фильтруем только валидные объекты (не null, не примитивы)
    return values.filter(item => 
      item !== null && 
      item !== undefined &&
      typeof item === 'object'
    ) as T[];
  }
  
  // Во всех остальных случаях возвращаем пустой массив
  return [];
}
