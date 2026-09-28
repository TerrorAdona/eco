import { describe, expect, it } from "vitest";
import {
    budgetInputSchema,
    parseOrThrow,
    recurringInputSchema,
    savingsGoalInputSchema,
    transactionInputSchema,
} from "./validators";

describe("budgetInputSchema", () => {
    it("accepte un budget valide", () => {
        expect(parseOrThrow(budgetInputSchema, { name: "Courses", amount: 50000, emoji: "", category: "Alimentation" }).name).toBe("Courses");
    });

    it("rejette nom vide, montant négatif et NaN", () => {
        expect(() => parseOrThrow(budgetInputSchema, { name: "   ", amount: 100, emoji: "" })).toThrow("Nom du budget requis");
        expect(() => parseOrThrow(budgetInputSchema, { name: "X", amount: -5, emoji: "" })).toThrow("Montant invalide");
        expect(() => parseOrThrow(budgetInputSchema, { name: "X", amount: NaN, emoji: "" })).toThrow("Montant invalide");
    });

    it("rejette les noms trop longs", () => {
        expect(() => parseOrThrow(budgetInputSchema, { name: "N".repeat(61), amount: 100, emoji: "" })).toThrow(
            "Nom du budget trop long (60 caractères maximum)"
        );
    });
});

describe("transactionInputSchema", () => {
    it("rejette description vide, montant nul et description trop longue", () => {
        expect(() => parseOrThrow(transactionInputSchema, { description: "  ", amount: 100 })).toThrow("Description requise");
        expect(() => parseOrThrow(transactionInputSchema, { description: "X", amount: 0 })).toThrow("Montant invalide");
        expect(() => parseOrThrow(transactionInputSchema, { description: "D".repeat(121), amount: 100 })).toThrow(
            "Description trop longue (120 caractères maximum)"
        );
    });
});

describe("savingsGoalInputSchema", () => {
    it("rejette épargné négatif, supérieur à la cible et dates incohérentes", () => {
        expect(() => parseOrThrow(savingsGoalInputSchema, { name: "X", targetAmount: 100, savedAmount: -1, targetDate: "2027-01-01", emoji: "" })).toThrow(
            "Montant épargné invalide"
        );
        expect(() => parseOrThrow(savingsGoalInputSchema, { name: "X", targetAmount: 100, savedAmount: 200, targetDate: "2027-01-01", emoji: "" })).toThrow(
            "Le montant épargné dépasse la cible"
        );
        expect(() => parseOrThrow(savingsGoalInputSchema, { name: "X", targetAmount: 100, savedAmount: 0, targetDate: "nope", emoji: "" })).toThrow(
            "Date cible invalide"
        );
    });
});

describe("recurringInputSchema", () => {
    it("rejette fin avant début et fin invalide", () => {
        expect(() =>
            parseOrThrow(recurringInputSchema, { description: "X", amount: 10, startDate: "2026-09-01", endDate: "2026-01-01" })
        ).toThrow("La date de fin doit suivre la date de début");
        expect(() =>
            parseOrThrow(recurringInputSchema, { description: "X", amount: 10, startDate: "2026-09-01", endDate: "nope" })
        ).toThrow("Date de fin invalide");
    });

    it("normalise catégorie, type et fréquence inconnus", () => {
        const parsed = parseOrThrow(recurringInputSchema, { description: "X", amount: 10, type: "??", category: "??", frequency: "??", startDate: "2026-09-01" });
        expect(parsed.type).toBe("DEPENSE");
        expect(parsed.category).toBe("Autres");
        expect(parsed.frequency).toBe("MONTHLY");
    });
});
