import { describe, expect, it } from "vitest";
import {
    accountInputSchema,
    budgetInputSchema,
    contributionSchema,
    parseOrThrow,
    recurringInputSchema,
    savingsGoalInputSchema,
    topUpSchema,
    transactionInputSchema,
    transferInputSchema,
} from "./validators";

describe("budgetInputSchema", () => {
    it("accepte un budget valide", () => {
        expect(parseOrThrow(budgetInputSchema, { name: "Courses", amount: 50000, category: "Alimentation" }).name).toBe("Courses");
    });

    it("rejette nom vide, montant négatif et NaN", () => {
        expect(() => parseOrThrow(budgetInputSchema, { name: "   ", amount: 100 })).toThrow("Nom du budget requis");
        expect(() => parseOrThrow(budgetInputSchema, { name: "X", amount: -5 })).toThrow("Montant invalide");
        expect(() => parseOrThrow(budgetInputSchema, { name: "X", amount: NaN })).toThrow("Montant invalide");
    });

    it("rejette les noms trop longs", () => {
        expect(() => parseOrThrow(budgetInputSchema, { name: "N".repeat(61), amount: 100 })).toThrow(
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
        expect(() => parseOrThrow(savingsGoalInputSchema, { name: "X", targetAmount: 100, savedAmount: -1, targetDate: "2027-01-01" })).toThrow(
            "Montant épargné invalide"
        );
        expect(() => parseOrThrow(savingsGoalInputSchema, { name: "X", targetAmount: 100, savedAmount: 200, targetDate: "2027-01-01" })).toThrow(
            "Le montant épargné dépasse la cible"
        );
        expect(() => parseOrThrow(savingsGoalInputSchema, { name: "X", targetAmount: 100, savedAmount: 0, targetDate: "nope" })).toThrow(
            "Date cible invalide"
        );
    });
});

describe("accountInputSchema", () => {
    it("accepte un compte valide", () => {
        const parsed = parseOrThrow(accountInputSchema, { name: "Courant", type: "COURANT", currency: "MGA", balance: 1000 });
        expect(parsed.name).toBe("Courant");
    });

    it("rejette nom vide, type/devise inconnus et solde non fini", () => {
        expect(() => parseOrThrow(accountInputSchema, { name: "  ", type: "COURANT", currency: "MGA", balance: 0 })).toThrow(
            "Nom du compte requis"
        );
        expect(() => parseOrThrow(accountInputSchema, { name: "X", type: "LIVRET", currency: "MGA", balance: 0 })).toThrow(
            "Type de compte invalide"
        );
        expect(() => parseOrThrow(accountInputSchema, { name: "X", type: "COURANT", currency: "CHF", balance: 0 })).toThrow(
            "Devise invalide"
        );
        expect(() => parseOrThrow(accountInputSchema, { name: "X", type: "COURANT", currency: "MGA", balance: NaN })).toThrow(
            "Solde invalide"
        );
    });

    it("autorise un solde négatif (découvert)", () => {
        expect(parseOrThrow(accountInputSchema, { name: "X", type: "COURANT", currency: "EUR", balance: -150.5 }).balance).toBe(-150.5);
    });
});

describe("transferInputSchema", () => {
    it("accepte un transfert valide", () => {
        const parsed = parseOrThrow(transferInputSchema, { sourceAccountId: "a", destAccountId: "b", amount: 20000, description: null });
        expect(parsed.amount).toBe(20000);
    });

    it("rejette même compte, montant nul et comptes manquants", () => {
        expect(() => parseOrThrow(transferInputSchema, { sourceAccountId: "a", destAccountId: "a", amount: 100 })).toThrow(
            "Les comptes source et destination doivent être différents"
        );
        expect(() => parseOrThrow(transferInputSchema, { sourceAccountId: "a", destAccountId: "b", amount: 0 })).toThrow(
            "Montant invalide"
        );
        expect(() => parseOrThrow(transferInputSchema, { sourceAccountId: "", destAccountId: "b", amount: 100 })).toThrow(
            "Compte source requis"
        );
    });
});

describe("topUpSchema", () => {
    it("accepte un rechargement valide et rejette zéro/négatif", () => {
        expect(parseOrThrow(topUpSchema, { accountId: "abc", amount: 20000 }).amount).toBe(20000);
        expect(() => parseOrThrow(topUpSchema, { accountId: "abc", amount: 0 })).toThrow("Montant invalide");
        expect(() => parseOrThrow(topUpSchema, { accountId: "", amount: 100 })).toThrow("Compte non trouvé");
    });
});

describe("contributionSchema", () => {
    it("accepte un versement valide et rejette zéro/négatif", () => {
        expect(parseOrThrow(contributionSchema, { goalId: "abc", amount: 500 }).amount).toBe(500);
        expect(() => parseOrThrow(contributionSchema, { goalId: "abc", amount: 0 })).toThrow("Montant invalide");
        expect(() => parseOrThrow(contributionSchema, { goalId: "", amount: 500 })).toThrow("Objectif non trouvé");
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
