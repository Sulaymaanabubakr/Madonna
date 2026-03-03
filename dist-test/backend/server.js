"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var cors_1 = __importDefault(require("cors"));
var express_1 = __importDefault(require("express"));
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
var node_crypto_1 = require("node:crypto");
var admin_1 = require("../src/lib/firebase/admin");
var email_1 = require("../src/lib/email");
var schemas_1 = require("../src/lib/schemas");
var auth_1 = require("./auth");
var cloudinary_1 = __importDefault(require("../src/lib/cloudinary"));
var product_serialization_1 = require("../src/lib/product-serialization");
var settings_serialization_1 = require("../src/lib/settings-serialization");
var app = (0, express_1.default)();
var PORT = Number(process.env.PORT || 3001);
var PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
var allowedOrigins = __spreadArray(__spreadArray(__spreadArray([], (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map(function (v) { return v.trim(); })
    .filter(Boolean), true), (process.env.VERCEL_URL ? ["https://".concat(process.env.VERCEL_URL)] : []), true), [
    "http://localhost:3000",
    "http://localhost:5173",
], false);
// Returns true for any origin that is explicitly allowed or is a Vercel preview deployment.
function isOriginAllowed(origin) {
    if (allowedOrigins.includes(origin))
        return true;
    // Allow all Vercel preview deployments (*.vercel.app)
    try {
        var hostname = new URL(origin).hostname;
        if (hostname.endsWith(".vercel.app"))
            return true;
    }
    catch (_a) {
        // ignore malformed origins
    }
    return false;
}
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        if (isOriginAllowed(origin))
            return callback(null, true);
        return callback(new Error("CORS blocked"));
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
function rateLimitJsonHandler(req, res) {
    res.status(429).json({
        success: false,
        error: "Too many requests. Please wait a few minutes and try again.",
        path: req.path,
    });
}
var publicWriteLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitJsonHandler,
});
var paymentVerifyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitJsonHandler,
});
function createOrderNumber() {
    return "MLX-".concat(Date.now(), "-").concat((0, node_crypto_1.randomUUID)().slice(0, 6).toUpperCase());
}
app.get("/health", function (_req, res) {
    res.json({ ok: true });
});
app.post("/api/orders", publicWriteLimiter, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, flattened, fieldEntries, formMessage, message, data, authenticatedUserId, requester, _a, productSnapshots_1, validatedItems_1, missingProductIds_1, inactiveProductIds_1, insufficientStockItems_1, subtotal, settingsSnap, deliveryFee, total, orderRef, now, orderNumber, newOrder, sanitizedOrder, error_1, message, statusCode;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 9, , 10]);
                parsed = schemas_1.checkoutSchema.safeParse(req.body);
                if (!parsed.success) {
                    flattened = parsed.error.flatten();
                    fieldEntries = Object.entries(flattened.fieldErrors)
                        .map(function (_a) {
                        var field = _a[0], messages = _a[1];
                        var first = Array.isArray(messages) ? messages[0] : undefined;
                        return first ? "".concat(field, ": ").concat(first) : "";
                    })
                        .filter(Boolean);
                    formMessage = flattened.formErrors[0] || "";
                    message = __spreadArray([formMessage], fieldEntries, true).filter(Boolean).join(" | ") || "Invalid checkout payload";
                    res.status(400).json({ success: false, error: message, details: flattened });
                    return [2 /*return*/];
                }
                data = parsed.data;
                authenticatedUserId = void 0;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, auth_1.getUserFromRequest)(req)];
            case 2:
                requester = _c.sent();
                authenticatedUserId = requester.uid;
                return [3 /*break*/, 4];
            case 3:
                _a = _c.sent();
                authenticatedUserId = undefined;
                return [3 /*break*/, 4];
            case 4: return [4 /*yield*/, Promise.all(data.items.map(function (item) { return __awaiter(void 0, void 0, void 0, function () {
                    var byId, slug, bySlug, name, byName;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, (0, admin_1.getAdminDb)().collection("products").doc(item.productId).get()];
                            case 1:
                                byId = _a.sent();
                                if (byId.exists)
                                    return [2 /*return*/, byId];
                                slug = String(item.productSlug || "").trim();
                                if (!slug) return [3 /*break*/, 3];
                                return [4 /*yield*/, (0, admin_1.getAdminDb)().collection("products").where("slug", "==", slug).limit(1).get()];
                            case 2:
                                bySlug = _a.sent();
                                if (!bySlug.empty)
                                    return [2 /*return*/, bySlug.docs[0]];
                                _a.label = 3;
                            case 3:
                                name = String(item.name || "").trim();
                                if (!name) return [3 /*break*/, 5];
                                return [4 /*yield*/, (0, admin_1.getAdminDb)().collection("products").where("name", "==", name).limit(1).get()];
                            case 4:
                                byName = _a.sent();
                                if (!byName.empty)
                                    return [2 /*return*/, byName.docs[0]];
                                _a.label = 5;
                            case 5: return [2 /*return*/, byId];
                        }
                    });
                }); }))];
            case 5:
                productSnapshots_1 = _c.sent();
                validatedItems_1 = [];
                missingProductIds_1 = [];
                inactiveProductIds_1 = [];
                insufficientStockItems_1 = [];
                data.items.forEach(function (item, idx) {
                    var _a, _b, _c, _d;
                    var snap = productSnapshots_1[idx];
                    if (!snap.exists) {
                        missingProductIds_1.push(item.productId);
                        return;
                    }
                    var product = snap.data();
                    if (!product.isActive) {
                        inactiveProductIds_1.push(item.productId);
                        return;
                    }
                    var liveStock = typeof product.stockQty === "number" ? product.stockQty : 0;
                    if (item.qty > liveStock) {
                        insufficientStockItems_1.push({
                            productId: item.productId,
                            requestedQty: item.qty,
                            availableQty: liveStock,
                        });
                        if (liveStock < 1)
                            return;
                        validatedItems_1.push({
                            productId: item.productId,
                            productSlug: item.productSlug,
                            name: product.name || item.name,
                            price: Number(product.price || 0),
                            qty: liveStock,
                            imageUrl: ((_b = (_a = product.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || item.imageUrl,
                            stockQty: Number(product.stockQty || item.stockQty),
                        });
                        return;
                    }
                    validatedItems_1.push({
                        productId: item.productId,
                        productSlug: item.productSlug,
                        name: product.name || item.name,
                        price: Number(product.price || 0),
                        qty: item.qty,
                        imageUrl: ((_d = (_c = product.images) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.url) || item.imageUrl,
                        stockQty: Number(product.stockQty || item.stockQty),
                    });
                });
                if (validatedItems_1.length === 0 && (missingProductIds_1.length || inactiveProductIds_1.length || insufficientStockItems_1.length)) {
                    res.status(409).json({
                        success: false,
                        code: "CART_OUTDATED",
                        error: "Some products in your cart are no longer available or have changed stock.",
                        details: {
                            missingProductIds: missingProductIds_1,
                            inactiveProductIds: inactiveProductIds_1,
                            insufficientStockItems: insufficientStockItems_1,
                        },
                    });
                    return [2 /*return*/];
                }
                subtotal = validatedItems_1.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
                return [4 /*yield*/, (0, admin_1.getAdminDb)().collection("settings").doc("store").get()];
            case 6:
                settingsSnap = _c.sent();
                deliveryFee = Number(((_b = settingsSnap.data()) === null || _b === void 0 ? void 0 : _b.deliveryFee) || 0);
                total = subtotal + deliveryFee;
                orderRef = (0, admin_1.getAdminDb)().collection("orders").doc();
                now = new Date().toISOString();
                orderNumber = createOrderNumber();
                newOrder = {
                    id: orderRef.id,
                    orderNumber: orderNumber,
                    customer: {
                        name: data.customer.name,
                        email: data.customer.email,
                        phone: data.customer.phone,
                    },
                    items: validatedItems_1,
                    subtotal: subtotal,
                    deliveryFee: deliveryFee,
                    total: total,
                    shippingAddress: {
                        fullName: data.shippingAddress.fullName,
                        phone: data.shippingAddress.phone,
                        addressLine1: data.shippingAddress.addressLine1,
                        city: data.shippingAddress.city,
                        state: data.shippingAddress.state,
                        notes: data.shippingAddress.notes,
                    },
                    payment: {
                        provider: "paystack",
                        reference: "",
                        status: "unpaid",
                    },
                    status: "pending",
                    createdAt: now,
                    updatedAt: now,
                };
                if (authenticatedUserId) {
                    newOrder.userId = authenticatedUserId;
                }
                sanitizedOrder = JSON.parse(JSON.stringify(newOrder));
                return [4 /*yield*/, orderRef.set(sanitizedOrder)];
            case 7:
                _c.sent();
                return [4 /*yield*/, orderRef.collection("statusEvents").add({
                        status: "pending",
                        note: "Order created, waiting for payment",
                        createdAt: now,
                    })];
            case 8:
                _c.sent();
                res.json({
                    success: true,
                    orderId: orderRef.id,
                    orderNumber: orderNumber,
                    amount: total,
                    adjustments: {
                        missingProductIds: missingProductIds_1,
                        inactiveProductIds: inactiveProductIds_1,
                        insufficientStockItems: insufficientStockItems_1,
                    },
                });
                return [3 /*break*/, 10];
            case 9:
                error_1 = _c.sent();
                message = error_1.message;
                console.error("[/api/orders] checkout error:", error_1);
                statusCode = message.startsWith("Product") || message.startsWith("Insufficient stock") ? 400 : 500;
                res.status(statusCode).json({ success: false, error: message });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
app.get("/api/orders/track", publicWriteLimiter, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var orderIdOrNumber, email, phone, orderDoc, orderNumberQuery, order, customer, emailMatch, phoneMatch, statusEventsSnap, statusEvents, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                orderIdOrNumber = String(req.query.orderId || req.query.orderNumber || "").trim();
                email = String(req.query.email || "").toLowerCase();
                phone = String(req.query.phone || "");
                if (!orderIdOrNumber || (!email && !phone)) {
                    res.status(400).json({ error: "orderId/orderNumber and email or phone required" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, (0, admin_1.getAdminDb)().collection("orders").doc(orderIdOrNumber).get()];
            case 1:
                orderDoc = _a.sent();
                if (!!orderDoc.exists) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, admin_1.getAdminDb)()
                        .collection("orders")
                        .where("orderNumber", "==", orderIdOrNumber)
                        .limit(1)
                        .get()];
            case 2:
                orderNumberQuery = _a.sent();
                if (!orderNumberQuery.empty) {
                    orderDoc = orderNumberQuery.docs[0];
                }
                _a.label = 3;
            case 3:
                if (!orderDoc.exists) {
                    res.status(404).json({ error: "Order not found" });
                    return [2 /*return*/];
                }
                order = orderDoc.data();
                customer = (order.customer || {});
                emailMatch = email && String(customer.email || "").toLowerCase() === email;
                phoneMatch = phone && String(customer.phone || "") === phone;
                if (!emailMatch && !phoneMatch) {
                    res.status(403).json({ error: "Verification failed" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, orderDoc.ref.collection("statusEvents").get()];
            case 4:
                statusEventsSnap = _a.sent();
                statusEvents = statusEventsSnap.docs
                    .map(function (doc) { return doc.data(); })
                    .sort(function (a, b) { return String(a.createdAt || "").localeCompare(String(b.createdAt || "")); });
                res.json({
                    order: {
                        id: orderDoc.id,
                        orderNumber: order.orderNumber,
                        status: order.status,
                        createdAt: order.createdAt,
                        updatedAt: order.updatedAt,
                        items: order.items,
                        total: order.total,
                    },
                    statusEvents: statusEvents,
                });
                return [3 /*break*/, 6];
            case 5:
                error_2 = _a.sent();
                res.status(500).json({ error: error_2.message });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.post("/api/paystack/initialize", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, orderId, email, amount, orderRef, orderDoc, order, orderEmail, expectedAmount, amountInKobo, baseUrl, paystackRes, data, error_3;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 5, , 6]);
                _a = req.body, orderId = _a.orderId, email = _a.email, amount = _a.amount;
                if (!orderId || !email) {
                    res.status(400).json({ success: false, error: "orderId and email are required." });
                    return [2 /*return*/];
                }
                if (!PAYSTACK_SECRET_KEY) {
                    res.status(500).json({ success: false, error: "Paystack secret key not configured." });
                    return [2 /*return*/];
                }
                orderRef = (0, admin_1.getAdminDb)().collection("orders").doc(String(orderId));
                return [4 /*yield*/, orderRef.get()];
            case 1:
                orderDoc = _d.sent();
                if (!orderDoc.exists) {
                    res.status(404).json({ success: false, error: "Order not found." });
                    return [2 /*return*/];
                }
                order = orderDoc.data();
                if ((((_b = order.payment) === null || _b === void 0 ? void 0 : _b.status) || "unpaid") === "paid") {
                    res.status(400).json({ success: false, error: "Order payment already completed." });
                    return [2 /*return*/];
                }
                orderEmail = String(((_c = order.customer) === null || _c === void 0 ? void 0 : _c.email) || "").toLowerCase();
                if (orderEmail && orderEmail !== String(email).toLowerCase()) {
                    res.status(400).json({ success: false, error: "Email does not match order." });
                    return [2 /*return*/];
                }
                expectedAmount = Number(order.total || 0);
                if (expectedAmount <= 0) {
                    res.status(400).json({ success: false, error: "Invalid order total." });
                    return [2 /*return*/];
                }
                if (amount !== undefined && Math.round(Number(amount)) !== Math.round(expectedAmount)) {
                    res.status(400).json({ success: false, error: "Amount does not match order total." });
                    return [2 /*return*/];
                }
                amountInKobo = Math.round(expectedAmount * 100);
                baseUrl = process.env.APP_URL || allowedOrigins[0] || "http://localhost:3000";
                return [4 /*yield*/, fetch("https://api.paystack.co/transaction/initialize", {
                        method: "POST",
                        headers: {
                            Authorization: "Bearer ".concat(PAYSTACK_SECRET_KEY),
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            email: email,
                            amount: amountInKobo,
                            metadata: { orderId: orderId },
                            callback_url: "".concat(baseUrl, "/checkout/verify"),
                        }),
                    })];
            case 2:
                paystackRes = _d.sent();
                return [4 /*yield*/, paystackRes.json()];
            case 3:
                data = _d.sent();
                if (!data.status) {
                    res.status(400).json({ success: false, error: data.message });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, orderRef.update({
                        "payment.reference": data.data.reference,
                        updatedAt: new Date().toISOString(),
                    })];
            case 4:
                _d.sent();
                res.json({
                    success: true,
                    authorization_url: data.data.authorization_url,
                    reference: data.data.reference,
                });
                return [3 /*break*/, 6];
            case 5:
                error_3 = _d.sent();
                res.status(500).json({ success: false, error: error_3.message });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.post("/api/paystack/verify", paymentVerifyLimiter, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var reference, verifyRes, verifyData, verifyStatus, paymentStatus, refQuery, orderDoc, orderRef_1, orderId, orderData, metadataOrderId, expectedKobo, paidKobo, paymentTransitioned_1, customerEmail, orderNumber, error_4, message, statusCode;
    var _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _f.trys.push([0, 7, , 8]);
                reference = req.body.reference;
                if (!reference) {
                    res.status(400).json({ success: false, error: "Missing reference" });
                    return [2 /*return*/];
                }
                if (!PAYSTACK_SECRET_KEY) {
                    res.status(500).json({ success: false, error: "Paystack secret key not configured." });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, fetch("https://api.paystack.co/transaction/verify/".concat(reference), {
                        method: "GET",
                        headers: { Authorization: "Bearer ".concat(PAYSTACK_SECRET_KEY) },
                    })];
            case 1:
                verifyRes = _f.sent();
                return [4 /*yield*/, verifyRes.json()];
            case 2:
                verifyData = _f.sent();
                verifyStatus = Boolean(verifyData === null || verifyData === void 0 ? void 0 : verifyData.status);
                paymentStatus = String(((_a = verifyData === null || verifyData === void 0 ? void 0 : verifyData.data) === null || _a === void 0 ? void 0 : _a.status) || "");
                if (!verifyStatus || paymentStatus !== "success") {
                    res.status(400).json({ success: false, error: "Payment verification failed" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, (0, admin_1.getAdminDb)().collection("orders").where("payment.reference", "==", reference).limit(1).get()];
            case 3:
                refQuery = _f.sent();
                if (refQuery.empty) {
                    res.status(404).json({ success: false, error: "No order found for payment reference" });
                    return [2 /*return*/];
                }
                orderDoc = refQuery.docs[0];
                orderRef_1 = orderDoc.ref;
                orderId = orderDoc.id;
                orderData = orderDoc.data();
                metadataOrderId = (_c = (_b = verifyData === null || verifyData === void 0 ? void 0 : verifyData.data) === null || _b === void 0 ? void 0 : _b.metadata) === null || _c === void 0 ? void 0 : _c.orderId;
                if (metadataOrderId && metadataOrderId !== orderId) {
                    res.status(400).json({ success: false, error: "Payment metadata does not match order reference" });
                    return [2 /*return*/];
                }
                expectedKobo = Math.round(Number(orderData.total || 0) * 100);
                paidKobo = Number(((_d = verifyData === null || verifyData === void 0 ? void 0 : verifyData.data) === null || _d === void 0 ? void 0 : _d.amount) || 0);
                if (expectedKobo <= 0 || paidKobo !== expectedKobo) {
                    res.status(400).json({ success: false, error: "Paid amount does not match order total" });
                    return [2 /*return*/];
                }
                paymentTransitioned_1 = false;
                return [4 /*yield*/, (0, admin_1.getAdminDb)().runTransaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var latestOrderDoc, latestOrder, latestPayment, latestStatus, items, _i, items_1, item, productId, qty, productRef, productDoc, product, currentStock, now;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, tx.get(orderRef_1)];
                                case 1:
                                    latestOrderDoc = _b.sent();
                                    if (!latestOrderDoc.exists)
                                        throw new Error("Order no longer exists");
                                    latestOrder = latestOrderDoc.data();
                                    latestPayment = ((_a = latestOrder.payment) === null || _a === void 0 ? void 0 : _a.status) || "unpaid";
                                    latestStatus = String(latestOrder.status || "");
                                    if (latestPayment === "paid")
                                        return [2 /*return*/];
                                    if (!(latestStatus === "pending" && latestPayment === "unpaid")) {
                                        throw new Error("Order is not payable in its current status");
                                    }
                                    items = Array.isArray(latestOrder.items)
                                        ? latestOrder.items
                                        : [];
                                    _i = 0, items_1 = items;
                                    _b.label = 2;
                                case 2:
                                    if (!(_i < items_1.length)) return [3 /*break*/, 5];
                                    item = items_1[_i];
                                    productId = String(item.productId || "");
                                    qty = Math.floor(Number(item.qty || 0));
                                    if (!productId || qty < 1)
                                        throw new Error("Invalid order item while confirming payment");
                                    productRef = (0, admin_1.getAdminDb)().collection("products").doc(productId);
                                    return [4 /*yield*/, tx.get(productRef)];
                                case 3:
                                    productDoc = _b.sent();
                                    if (!productDoc.exists)
                                        throw new Error("Product no longer exists: ".concat(productId));
                                    product = productDoc.data();
                                    currentStock = Number(product.stockQty || 0);
                                    if (!Number.isFinite(currentStock) || currentStock < qty) {
                                        throw new Error("Insufficient stock for: ".concat(product.name || productId));
                                    }
                                    tx.update(productRef, {
                                        stockQty: currentStock - qty,
                                        updatedAt: new Date().toISOString(),
                                    });
                                    _b.label = 4;
                                case 4:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 5:
                                    now = new Date().toISOString();
                                    tx.update(orderRef_1, {
                                        status: "confirmed",
                                        "payment.status": "paid",
                                        "payment.paidAt": now,
                                        updatedAt: now,
                                    });
                                    tx.set(orderRef_1.collection("statusEvents").doc(), {
                                        status: "confirmed",
                                        note: "Payment verified successfully via Paystack",
                                        createdAt: now,
                                    });
                                    paymentTransitioned_1 = true;
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 4:
                _f.sent();
                if (!paymentTransitioned_1) return [3 /*break*/, 6];
                customerEmail = String(((_e = orderData.customer) === null || _e === void 0 ? void 0 : _e.email) || "");
                orderNumber = String(orderData.orderNumber || orderId);
                if (!customerEmail) return [3 /*break*/, 6];
                return [4 /*yield*/, (0, email_1.sendOrderEmail)(customerEmail, orderNumber).catch(function () { return undefined; })];
            case 5:
                _f.sent();
                _f.label = 6;
            case 6:
                res.json({ success: true, orderId: orderId });
                return [3 /*break*/, 8];
            case 7:
                error_4 = _f.sent();
                message = error_4.message;
                console.error("[/api/paystack/verify] verify error:", error_4);
                statusCode = message.includes("Insufficient stock") ||
                    message.includes("Product no longer exists") ||
                    message.includes("Order no longer exists") ||
                    message.includes("Order is not payable") ||
                    message.includes("Invalid order item")
                    ? 409
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    error: message || "Payment verification failed due to an unexpected server error.",
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
// Debug endpoint to check Vercel production health and Firebase initialization
app.get("/api/health", function (req, res) {
    try {
        var adminAuthCheck = !!(0, admin_1.getAdminAuth)();
        var adminDbCheck = !!(0, admin_1.getAdminDb)();
        res.json({
            status: "ok",
            environment: process.env.NODE_ENV,
            firebase: {
                authInitialized: adminAuthCheck,
                dbInitialized: adminDbCheck,
                projectIdPresent: !!process.env.FIREBASE_PROJECT_ID,
                clientEmailPresent: !!process.env.FIREBASE_CLIENT_EMAIL,
                privateKeyLength: (process.env.FIREBASE_PRIVATE_KEY || "").length,
            },
            paystackKeyPresent: !!PAYSTACK_SECRET_KEY,
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            error: String(error),
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
    }
});
app.get("/api/admin/settings", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var docRef, snap, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, (0, auth_1.requireAdmin)(req)];
            case 1:
                _a.sent();
                docRef = (0, admin_1.getAdminDb)().collection("settings").doc("store");
                return [4 /*yield*/, docRef.get()];
            case 2:
                snap = _a.sent();
                if (!!snap.exists) return [3 /*break*/, 4];
                return [4 /*yield*/, docRef.set(__assign({}, settings_serialization_1.defaultStoreSettings))];
            case 3:
                _a.sent();
                res.json({ item: settings_serialization_1.defaultStoreSettings });
                return [2 /*return*/];
            case 4:
                res.json({ item: (0, settings_serialization_1.serializeStoreSettings)(snap.data()) });
                return [3 /*break*/, 6];
            case 5:
                error_5 = _a.sent();
                res.status(403).json({ error: error_5.message });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.put("/api/admin/settings", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var serialized, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, auth_1.requireAdmin)(req)];
            case 1:
                _a.sent();
                serialized = (0, settings_serialization_1.serializeStoreSettings)(req.body);
                return [4 /*yield*/, (0, admin_1.getAdminDb)().collection("settings").doc("store").set(__assign(__assign({}, serialized), { updatedAt: new Date().toISOString() }), { merge: true })];
            case 2:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                res.status(403).json({ error: error_6.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.post("/api/admin/upload", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var image, result, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, auth_1.requireAdmin)(req)];
            case 1:
                _a.sent();
                image = req.body.image;
                if (!image) {
                    res.status(400).json({ error: "No image provided" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, cloudinary_1.default.uploader.upload(image, { folder: "madonna_products" })];
            case 2:
                result = _a.sent();
                res.json({ url: result.secure_url, publicId: result.public_id });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                res.status(500).json({ error: error_7.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get("/api/admin/orders", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot, items, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, auth_1.requireAdmin)(req)];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, admin_1.getAdminDb)().collection("orders").get()];
            case 2:
                snapshot = _a.sent();
                items = snapshot.docs
                    .map(function (doc) { return (__assign({ id: doc.id }, doc.data())); })
                    .sort(function (a, b) {
                    return new Date(String(b.createdAt || 0)).getTime() -
                        new Date(String(a.createdAt || 0)).getTime();
                });
                res.json({ items: items });
                return [3 /*break*/, 4];
            case 3:
                error_8 = _a.sent();
                res.status(403).json({ error: error_8.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get("/api/admin/products", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot, items, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, auth_1.requireAdmin)(req)];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, admin_1.getAdminDb)().collection("products").get()];
            case 2:
                snapshot = _a.sent();
                items = snapshot.docs.map(function (doc) { return (0, product_serialization_1.serializeProduct)(doc.id, doc.data()); });
                res.json({ items: items });
                return [3 /*break*/, 4];
            case 3:
                error_9 = _a.sent();
                res.status(403).json({ error: error_9.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
if (process.env.VERCEL !== "1") {
    app.listen(PORT, function () {
        console.log("API server running on http://localhost:".concat(PORT));
    });
}
exports.default = app;
