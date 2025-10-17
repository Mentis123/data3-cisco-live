import { db, hasDatabase } from "../db";
import { createDatabaseStorage } from "./database";
import { createMemoryStorage } from "./memory";

export const storage = hasDatabase && db ? createDatabaseStorage(db) : createMemoryStorage();
export const storageKind = hasDatabase ? "database" : "memory";
