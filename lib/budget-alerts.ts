export const WARNING_THRESHOLD = 80;
export const CRITICAL_THRESHOLD = 100;

export type BudgetAlertLevel = "ok" | "warning" | "critical" | "over";

export interface BudgetAlert {
    level: BudgetAlertLevel;
    percentage: number;
    spent: number;
    remaining: number;
}

export function getBudgetAlert(spent: number, budgetAmount: number): BudgetAlert {
    const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
    const remaining = Math.max(0, budgetAmount - spent);
    if (spent > budgetAmount && budgetAmount > 0) {
        return { level: "over", percentage, spent, remaining };
    }
    if (percentage >= CRITICAL_THRESHOLD) {
        return { level: "critical", percentage, spent, remaining };
    }
    if (percentage >= WARNING_THRESHOLD) {
        return { level: "warning", percentage, spent, remaining };
    }
    return { level: "ok", percentage, spent, remaining };
}

export const BUDGET_ALERT_LABELS: Record<Exclude<BudgetAlertLevel, "ok">, string> = {
    warning: "Avertissement",
    critical: "Critique",
    over: "Dépassé",
};

export function hasBudgetAlert<B>(entry: { budget: B; alert: BudgetAlert }): entry is { budget: B; alert: BudgetAlert & { level: Exclude<BudgetAlertLevel, "ok"> } } {
    return entry.alert.level !== "ok";
}

export function isExpense<T extends { type?: string | null }>(t: T): boolean {
    return (t.type ?? "DEPENSE") !== "REVENU";
}

/** Somme des dépenses uniquement (revenus exclus). */
export function sumExpenses<T extends { amount: number; type?: string | null }>(transactions: T[]): number {
    return transactions.filter(isExpense).reduce((acc, t) => acc + t.amount, 0);
}

/** Somme des revenus uniquement. */
export function sumIncome<T extends { amount: number; type?: string | null }>(transactions: T[]): number {
    return transactions.filter((t) => !isExpense(t)).reduce((acc, t) => acc + t.amount, 0);
}
