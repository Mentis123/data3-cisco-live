import { db, hasDatabase } from "../db.ts";
import { createDatabaseStorage } from "./database.ts";
import { createMemoryStorage } from "./memory.ts";

export const storage = hasDatabase && db ? createDatabaseStorage(db) : createMemoryStorage();
export const storageKind = hasDatabase ? "database" : "memory";
