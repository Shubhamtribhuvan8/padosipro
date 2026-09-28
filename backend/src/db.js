import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { CATALOGUE } from "./catalogue.js";

export function openDatabase(filePath) {
  if (filePath !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  }
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,
      tasks_confirmed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      address TEXT NOT NULL,
      business_name TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS user_tasks (
      user_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      PRIMARY KEY (user_id, task_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      category_name TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      urgency TEXT NOT NULL,
      scheduled_for TEXT,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  ensureColumn(db, "users", "mobile", "ALTER TABLE users ADD COLUMN mobile TEXT");
  ensureColumn(db, "categories", "blurb", "ALTER TABLE categories ADD COLUMN blurb TEXT");
  ensureColumn(db, "categories", "icon", "ALTER TABLE categories ADD COLUMN icon TEXT");
  ensureColumn(db, "categories", "soon", "ALTER TABLE categories ADD COLUMN soon INTEGER NOT NULL DEFAULT 0");
  seedCatalogue(db);
  return db;
}

function ensureColumn(db, table, column, statement) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((item) => item.name === column)) db.exec(statement);
}

function seedCatalogue(db) {
  const insertCategory = db.prepare(
    `INSERT INTO categories (id, name, sort_order, blurb, icon, soon)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       sort_order = excluded.sort_order,
       blurb = excluded.blurb,
       icon = excluded.icon,
       soon = excluded.soon`,
  );
  const insertTask = db.prepare(
    "INSERT INTO tasks (id, category_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET category_id = excluded.category_id, name = excluded.name, description = excluded.description, sort_order = excluded.sort_order",
  );
  CATALOGUE.forEach((category, categoryIndex) => {
    insertCategory.run(category.id, category.name, categoryIndex, category.blurb, category.icon, category.soon ? 1 : 0);
    category.services.forEach((task, taskIndex) => {
      insertTask.run(task.id, category.id, task.name, task.description, taskIndex);
    });
  });
}
