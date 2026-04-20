import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'vignettes.db');

let db: Database.Database;

try {
  db = new Database(dbPath);
  
  // Initialize the database tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      play_name TEXT NOT NULL,
      playwright TEXT NOT NULL DEFAULT 'Anonymous',
      script_text TEXT NOT NULL,
      theme TEXT NOT NULL DEFAULT '',
      context TEXT NOT NULL DEFAULT '',
      paraphrase TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL,
      is_shared INTEGER DEFAULT 0
    )
  `);
} catch (error) {
  console.error('Failed to initialize database:', error);
}

export default db!;
