import { Platform } from "react-native";
import { enableScreens } from "react-native-screens";

// Enable optimized native screens for React Navigation
try {
  enableScreens(true);
} catch (e) {
  console.warn("Could not enable native screens:", e);
}

class MemoryStorage {
  private data: Record<string, string> = {};
  public isHydrated: boolean = false;

  constructor() {
    this.loadFromAsyncStorage();
  }

  async loadFromAsyncStorage() {
    if (Platform.OS !== "web") {
      try {
        const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
        const keys = await AsyncStorage.getAllKeys();
        const pairs = await AsyncStorage.multiGet(keys);
        for (const [key, value] of pairs) {
          if (value !== null) {
            this.data[key] = value;
          }
        }
      } catch (e) {
        console.warn("MemoryStorage hydration failed:", e);
      } finally {
        this.isHydrated = true;
      }
    } else {
      this.isHydrated = true;
    }
  }

  getItem(key: string): string | null {
    return this.data[key] !== undefined ? this.data[key] : null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = String(value);
    if (Platform.OS !== "web") {
      import("@react-native-async-storage/async-storage")
        .then(({ default: AsyncStorage }) => {
          AsyncStorage.setItem(key, String(value)).catch(() => {});
        })
        .catch(() => {});
    }
  }

  removeItem(key: string): void {
    delete this.data[key];
    if (Platform.OS !== "web") {
      import("@react-native-async-storage/async-storage")
        .then(({ default: AsyncStorage }) => {
          AsyncStorage.removeItem(key).catch(() => {});
        })
        .catch(() => {});
    }
  }

  clear(): void {
    this.data = {};
    if (Platform.OS !== "web") {
      import("@react-native-async-storage/async-storage")
        .then(({ default: AsyncStorage }) => {
          AsyncStorage.clear().catch(() => {});
        })
        .catch(() => {});
    }
  }

  get length(): number {
    return Object.keys(this.data).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.data);
    return keys[index] !== undefined ? keys[index] : null;
  }
}

if (Platform.OS !== "web") {
  const memStorage = new MemoryStorage();

  const g: any = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : {};

  if (!g.localStorage) {
    g.localStorage = memStorage;
  }
  if (!g.window) {
    g.window = g;
  }
  if (!g.window.localStorage) {
    g.window.localStorage = memStorage;
  }
  if (!g.location) {
    g.location = { href: "", pathname: "/", search: "", origin: "" };
  }
}
