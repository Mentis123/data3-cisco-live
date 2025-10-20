import { db, hasDatabase } from "../db.ts";
import { createDatabaseStorage } from "./database.ts";
import { createMemoryStorage } from "./memory.ts";
import { log } from "../logging.ts";

type MemoryStorage = ReturnType<typeof createMemoryStorage>;
type DatabaseStorage = ReturnType<typeof createDatabaseStorage>;

const memoryStorage = createMemoryStorage();
const databaseStorage = hasDatabase && db ? createDatabaseStorage(db) : null;

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function createResilientStorage(
  primary: DatabaseStorage,
  fallback: MemoryStorage,
  onFallback: () => void,
) {
  let activeKind: "database" | "memory" = "database";

  const ensureFallback = (operation: PropertyKey, error: unknown) => {
    if (activeKind === "memory") {
      console.error(`[storage] Fallback storage operation failed for ${String(operation)}:`, error);
      return;
    }

    const reason = formatError(error);
    log(
      `Database storage error during ${String(operation)} – switching to in-memory storage. ${reason}`,
      "storage",
    );
    activeKind = "memory";
    onFallback();
  };

  const handler: ProxyHandler<DatabaseStorage> = {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);

      if (typeof original !== "function") {
        return original;
      }

      return async (...args: unknown[]) => {
        if (activeKind === "memory") {
          const fallbackFn = Reflect.get(fallback as any, prop);
          if (typeof fallbackFn === "function") {
            return await fallbackFn.apply(fallback, args);
          }

          return await original.apply(target, args);
        }

        try {
          return await original.apply(target, args);
        } catch (error) {
          ensureFallback(prop, error);

          const fallbackFn = Reflect.get(fallback as any, prop);
          if (typeof fallbackFn === "function") {
            return await fallbackFn.apply(fallback, args);
          }

          throw error;
        }
      };
    },
  };

  return new Proxy(primary, handler) as MemoryStorage;
}

let storageKind: "database" | "memory" = databaseStorage ? "database" : "memory";
let storage: MemoryStorage;

if (databaseStorage) {
  storage = createResilientStorage(databaseStorage, memoryStorage, () => {
    storageKind = "memory";
  });
} else {
  storage = memoryStorage;
}

export { storage, storageKind };
