
export interface Budget {
    id: string;
    createdAt: Date;
    name: string;
    amount: number;
    category: string;
    transactions?: Transaction[];
}

export const TRANSACTION_CATEGORIES = [
    "Alimentation",
    "Transport",
    "Logement",
    "Santé",
    "Études",
    "Loisirs",
    "Shopping",
    "Abonnements",
    "Salaire",
    "Autres",
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number];

export const DEFAULT_TRANSACTION_CATEGORY: TransactionCategory = "Autres";

export function normalizeTransactionCategory(value: string | null | undefined): TransactionCategory {
    return (TRANSACTION_CATEGORIES as readonly string[]).includes(value ?? "")
        ? (value as TransactionCategory)
        : DEFAULT_TRANSACTION_CATEGORY;
}

export interface Transaction {
    id: string;
    amount: number;
    description: string
    category: string;
    createdAt: Date;
    budgetName?: string;
    budgetId?: string | null;
}

export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: Date;
    createdAt: Date;
}

export const RECURRING_FREQUENCIES = [
    "WEEKLY",
    "MONTHLY",
    "YEARLY",
] as const;

export type RecurringFrequency = typeof RECURRING_FREQUENCIES[number];

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
    WEEKLY: "Hebdomadaire",
    MONTHLY: "Mensuelle",
    YEARLY: "Annuelle",
};

export function normalizeRecurringFrequency(value: string | null | undefined): RecurringFrequency {
    return (RECURRING_FREQUENCIES as readonly string[]).includes(value ?? "")
        ? (value as RecurringFrequency)
        : "MONTHLY";
}

export const RECURRING_TYPES = [
    "DEPENSE",
    "REVENU",
] as const;

export type RecurringType = typeof RECURRING_TYPES[number];

export const RECURRING_TYPE_LABELS: Record<RecurringType, string> = {
    DEPENSE: "Dépense",
    REVENU: "Revenu",
};

export function normalizeRecurringType(value: string | null | undefined): RecurringType {
    return (RECURRING_TYPES as readonly string[]).includes(value ?? "")
        ? (value as RecurringType)
        : "DEPENSE";
}

export interface RecurringTransaction {
    id: string;
    description: string;
    amount: number;
    type: string;
    category: string;
    frequency: string;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    budgetId: string | null;
    budgetName?: string;
    createdAt: Date;
}