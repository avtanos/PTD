import Database from 'better-sqlite3';
import { config } from '../config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Убираем префикс sqlite:/// из пути, если есть
let dbPath = config.databasePath;
if (dbPath.startsWith('sqlite:///')) {
  dbPath = dbPath.replace('sqlite:///', '');
}
// Если относительный путь, делаем абсолютным относительно backend директории
if (!path.isAbsolute(dbPath)) {
  dbPath = path.resolve(process.cwd(), dbPath);
}

export const db = new Database(dbPath);

// Включаем внешние ключи для SQLite
db.pragma('foreign_keys = ON');

// Включаем журнальный режим для лучшей производительности
db.pragma('journal_mode = WAL');

export default db;
