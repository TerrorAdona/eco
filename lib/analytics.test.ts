import { describe, expect, it } from "vitest";
import { comparePeriods, detectUnusualSpending } from "./analytics";

const t = (id: string, amount: number, category = "Alimentation") => ({ id, amount, category, description: id });

describe("comparePeriods", () => {
    it("calcule la variation en pourcentage", () => {
        expect(comparePeriods(1200, 1000, 12, 10).deltaPercent).toBe(20);
        expect(comparePeriods(800, 1000, 8, 10).deltaPercent).toBe(-20);
    });

    it("retourne null sans période de référence", () => {
        expect(comparePeriods(0, 0, 0, 0).deltaPercent).toBeNull();
    });

    it("retourne 100 quand la période précédente est vide", () => {
        expect(comparePeriods(500, 0, 5, 0).deltaPercent).toBe(100);
    });
});

describe("detectUnusualSpending", () => {
    it("ne signale rien sans données", () => {
        expect(detectUnusualSpending([])).toEqual([]);
    });

    it("ignore les échantillons trop petits", () => {
        expect(detectUnusualSpending([t("a", 100), t("b", 110)])).toEqual([]);
    });

    it("signale un montant > 2x la moyenne des autres", () => {
        const flagged = detectUnusualSpending([t("a", 100), t("b", 110), t("c", 105), { ...t("d", 500), description: "Gros" }]);
        expect(flagged).toHaveLength(1);
        expect(flagged[0].id).toBe("d");
        expect(flagged[0].ratio).toBeGreaterThan(2);
    });

    it("ne signale rien quand c'est homogène", () => {
        expect(detectUnusualSpending([t("a", 100), t("b", 100), t("c", 100)])).toEqual([]);
    });

    it("raisonne par catégorie", () => {
        const flagged = detectUnusualSpending([
            t("a", 50, "Transport"), t("b", 55, "Transport"), t("c", 60, "Transport"), t("d", 400, "Transport"),
        ]);
        expect(flagged).toHaveLength(1);
        expect(flagged[0].category).toBe("Transport");
    });
});
