import { BUSINESS } from "./constants";
import type { StoreSettings } from "../types";

function toStringValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === "function") {
      return maybeTimestamp.toDate().toISOString();
    }
  }
  return fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBooleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (typeof value === "number") return value > 0;
  return fallback;
}

export const defaultStoreSettings: StoreSettings = {
  storeName: BUSINESS.name,
  storeAddress: BUSINESS.address,
  phone: BUSINESS.phone,
  email: BUSINESS.email,
  whatsapp: BUSINESS.whatsapp,
  deliveryFee: 2000,
  announcementEnabled: true,
  announcementText: "Welcome to Madonna Shopping Arena. Shop quality products with confidence.",
  announcementSpeed: 22,
  updatedAt: new Date().toISOString(),
};

export function serializeStoreSettings(raw?: Record<string, unknown>): StoreSettings {
  const source = raw ?? {};
  return {
    storeName: toStringValue(source.storeName, defaultStoreSettings.storeName),
    storeAddress: toStringValue(source.storeAddress, defaultStoreSettings.storeAddress),
    phone: toStringValue(source.phone, defaultStoreSettings.phone),
    email: toStringValue(source.email, defaultStoreSettings.email),
    whatsapp: toStringValue(source.whatsapp, defaultStoreSettings.whatsapp),
    deliveryFee: Math.max(0, Math.floor(toNumberValue(source.deliveryFee, defaultStoreSettings.deliveryFee))),
    announcementEnabled: toBooleanValue(source.announcementEnabled, defaultStoreSettings.announcementEnabled),
    announcementText: toStringValue(source.announcementText, defaultStoreSettings.announcementText),
    announcementSpeed: Math.min(60, Math.max(8, toNumberValue(source.announcementSpeed, defaultStoreSettings.announcementSpeed))),
    updatedAt: toStringValue(source.updatedAt, defaultStoreSettings.updatedAt),
  };
}
