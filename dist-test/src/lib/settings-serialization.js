"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultStoreSettings = void 0;
exports.serializeStoreSettings = serializeStoreSettings;
var constants_1 = require("./constants");
function toStringValue(value, fallback) {
    if (fallback === void 0) { fallback = ""; }
    if (typeof value === "string")
        return value;
    if (typeof value === "number" || typeof value === "boolean")
        return String(value);
    if (value && typeof value === "object") {
        var maybeTimestamp = value;
        if (typeof maybeTimestamp.toDate === "function") {
            return maybeTimestamp.toDate().toISOString();
        }
    }
    return fallback;
}
function toNumberValue(value, fallback) {
    if (fallback === void 0) { fallback = 0; }
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}
function toBooleanValue(value, fallback) {
    if (fallback === void 0) { fallback = false; }
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string")
        return value.toLowerCase() === "true";
    if (typeof value === "number")
        return value > 0;
    return fallback;
}
exports.defaultStoreSettings = {
    storeName: constants_1.BUSINESS.name,
    storeAddress: constants_1.BUSINESS.address,
    phone: constants_1.BUSINESS.phone,
    email: constants_1.BUSINESS.email,
    whatsapp: constants_1.BUSINESS.whatsapp,
    deliveryFee: 2000,
    announcementEnabled: true,
    announcementText: "Welcome to Madonna Shopping Arena. Shop quality products with confidence.",
    announcementSpeed: 22,
    updatedAt: new Date().toISOString(),
};
function serializeStoreSettings(raw) {
    var source = raw !== null && raw !== void 0 ? raw : {};
    return {
        storeName: toStringValue(source.storeName, exports.defaultStoreSettings.storeName),
        storeAddress: toStringValue(source.storeAddress, exports.defaultStoreSettings.storeAddress),
        phone: toStringValue(source.phone, exports.defaultStoreSettings.phone),
        email: toStringValue(source.email, exports.defaultStoreSettings.email),
        whatsapp: toStringValue(source.whatsapp, exports.defaultStoreSettings.whatsapp),
        deliveryFee: Math.max(0, Math.floor(toNumberValue(source.deliveryFee, exports.defaultStoreSettings.deliveryFee))),
        announcementEnabled: toBooleanValue(source.announcementEnabled, exports.defaultStoreSettings.announcementEnabled),
        announcementText: toStringValue(source.announcementText, exports.defaultStoreSettings.announcementText),
        announcementSpeed: Math.min(60, Math.max(8, toNumberValue(source.announcementSpeed, exports.defaultStoreSettings.announcementSpeed))),
        updatedAt: toStringValue(source.updatedAt, exports.defaultStoreSettings.updatedAt),
    };
}
