"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderEmail = sendOrderEmail;
var BREVO_API_KEY = process.env.BREVO_API_KEY || "";
var EMAIL_FROM = process.env.EMAIL_FROM || "";
var BRAND_COLOR = "#8B2030";
var STORE_NAME = process.env.EMAIL_FROM_NAME || "Madonna Shopping Arena";
/** Parse "Name <email>" format into { name, email } */
function parseSender(from) {
    var match = from.match(/^(.+?)\s*<(.+?)>$/);
    if (match)
        return { name: match[1].trim(), email: match[2].trim() };
    return { name: STORE_NAME, email: from.trim() };
}
function sendOrderEmail(to, orderNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var sender, html;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!BREVO_API_KEY || !EMAIL_FROM)
                        return [2 /*return*/];
                    sender = parseSender(EMAIL_FROM);
                    html = "\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>Order Confirmed</title>\n</head>\n<body style=\"margin:0;padding:0;background:#F4F4F4;font-family:Arial,sans-serif;\">\n  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#F4F4F4;padding:40px 0;\">\n    <tr>\n      <td align=\"center\">\n        <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;max-width:600px;width:100%;\">\n          <!-- Header -->\n          <tr>\n            <td style=\"background:".concat(BRAND_COLOR, ";padding:28px 40px;text-align:center;\">\n              <h1 style=\"margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:4px;text-transform:uppercase;\">\n                ").concat(STORE_NAME, "\n              </h1>\n            </td>\n          </tr>\n          <!-- Body -->\n          <tr>\n            <td style=\"padding:40px;\">\n              <h2 style=\"margin:0 0 16px;color:#111111;font-size:20px;font-weight:700;\">\n                Order Confirmed \u2713\n              </h2>\n              <p style=\"margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;\">\n                Thank you for your order! We've received your payment and are now\n                getting your items ready.\n              </p>\n              <!-- Order number box -->\n              <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#F4F4F4;border-left:4px solid ").concat(BRAND_COLOR, ";margin-bottom:32px;\">\n                <tr>\n                  <td style=\"padding:16px 20px;\">\n                    <p style=\"margin:0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999999;font-weight:700;\">Order Number</p>\n                    <p style=\"margin:4px 0 0;font-size:18px;font-weight:900;color:#111111;\">").concat(orderNumber, "</p>\n                  </td>\n                </tr>\n              </table>\n              <p style=\"margin:0 0 32px;color:#555555;font-size:14px;line-height:1.6;\">\n                You can track your order status at any time by visiting our website\n                and clicking <strong>Track Order</strong>.\n              </p>\n              <!-- CTA -->\n              <table cellpadding=\"0\" cellspacing=\"0\">\n                <tr>\n                  <td style=\"background:").concat(BRAND_COLOR, ";\">\n                    <a href=\"").concat(process.env.APP_URL || "https://madonnashoppingarena.com.ng", "/track\"\n                       style=\"display:inline-block;padding:14px 32px;color:#ffffff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;text-decoration:none;\">\n                      Track Your Order\n                    </a>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n          <!-- Footer -->\n          <tr>\n            <td style=\"background:#111111;padding:20px 40px;text-align:center;\">\n              <p style=\"margin:0;color:#777777;font-size:12px;\">\n                &copy; ").concat(new Date().getFullYear(), " ").concat(STORE_NAME, ". All rights reserved.\n              </p>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>");
                    return [4 /*yield*/, fetch("https://api.brevo.com/v3/smtp/email", {
                            method: "POST",
                            headers: {
                                "api-key": BREVO_API_KEY,
                                "Content-Type": "application/json",
                                Accept: "application/json",
                            },
                            body: JSON.stringify({
                                sender: { name: sender.name, email: sender.email },
                                to: [{ email: to }],
                                subject: "Order ".concat(orderNumber, " Confirmed \u2014 ").concat(STORE_NAME),
                                htmlContent: html,
                            }),
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
