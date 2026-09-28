import { describe, expect, it } from "vitest";
import { CRITICAL_THRESHOLD, getBudgetAlert, hasBudgetAlert, WARNING_THRESHOLD } from "./budget-alerts";

describe("getBudgetAlert", () => {
    it("expose les seuils 80 / 100", () => {
        expect(WARNING_THRESHOLD).toBe(80);
        expect(CRITICAL_THRESHOLD).toBe(100);
    });

    it("ok sous le seuil (cohérent avec l'affichage arrondi)", () => {
        expect(getBudgetAlert(0, 1000).level).toBe("ok");
        expect(getBudgetAlert(794, 1000).level).toBe("ok");
    });

    it("warning à partir de 80 % affiché", () => {
        expect(getBudgetAlert(800, 1000).level).toBe("warning");
        expect(getBudgetAlert(994, 1000).level).toBe("warning");
    });

    it("critical à 100 % affiché", () => {
        expect(getBudgetAlert(995, 1000).level).toBe("critical");
        expect(getBudgetAlert(1000, 1000).level).toBe("critical");
    });

    it("over au-delà de 100 % avec le pourcentage réel", () => {
        const alert = getBudgetAlert(1200, 1000);
        expect(alert.level).toBe("over");
        expect(alert.percentage).toBe(120);
        expect(alert.remaining).toBe(0);
    });

    it("budget à zéro sans division par zéro", () => {
        expect(getBudgetAlert(0, 0).level).toBe("ok");
    });

    it("prédicat hasBudgetAlert", () => {
        expect(hasBudgetAlert({ budget: 1, alert: getBudgetAlert(900, 1000) })).toBe(true);
        expect(hasBudgetAlert({ budget: 1, alert: getBudgetAlert(10, 1000) })).toBe(false);
    });
});
