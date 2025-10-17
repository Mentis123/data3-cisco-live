import { db, hasDatabase } from "../db.js";
import { createDatabaseStorage } from "./database.js";
import { createMemoryStorage } from "./memory.js";

export const storage = hasDatabase && db ? createDatabaseStorage(db) : createMemoryStorage();
export const storageKind = hasDatabase ? "database" : "memory";
