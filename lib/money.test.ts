import { describe, expect, it } from "vitest";
import { convertAmount, DEFAULT_CURRENCY, formatMoney, suggestSufficientAccounts } from "./money";

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

describe("suggestSufficientAccounts", () => {
    const accounts = [
        { id: "a", name: "A", balance: 5000 },
        { id: "b", name: "B", balance: 50000 },
        { id: "c", name: "C", balance: 20000 },
    ];

    it("propose les comptes solvables triés par solde, hors compte courant", () => {
        const result = suggestSufficientAccounts(accounts, 15000, "a");
        expect(result.map((a) => a.id)).toEqual(["c", "b"]);
    });

    it("ne propose rien sans montant valide ou sans solvable", () => {
        expect(suggestSufficientAccounts(accounts, 0, "a")).toEqual([]);
        expect(suggestSufficientAccounts(accounts, NaN, "a")).toEqual([]);
        expect(suggestSufficientAccounts(accounts, 999999, "a")).toEqual([]);
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
