import { describe, expect, it } from "vitest";
import { convertAmount, DEFAULT_CURRENCY, formatMoney } from "./money";

describe("formatMoney", () => {
    it("formate avec la devise fournie", () => {
        const formatted = formatMoney(12000, "EUR");
        expect(formatted).toContain("12");
        expect(formatted.endsWith("EUR")).toBe(true);
    });

    it("replie sur MGA sans devise", () => {
        expect(DEFAULT_CURRENCY).toBe("MGA");
        expect(formatMoney(50, null).endsWith("MGA")).toBe(true);
        expect(formatMoney(50, undefined).endsWith("MGA")).toBe(true);
    });
});

describe("convertAmount", () => {
    it("convertit avec un taux explicite, sans taux inventé", () => {
        expect(convertAmount(100, 5000)).toBe(500000);
    });

    it("rejette les taux invalides", () => {
        expect(() => convertAmount(100, 0)).toThrow("Taux de change invalide");
        expect(() => convertAmount(100, -2)).toThrow("Taux de change invalide");
        expect(() => convertAmount(100, NaN)).toThrow("Taux de change invalide");
    });
});
